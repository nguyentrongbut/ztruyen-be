// ** NestJS
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** Schemas
import { User } from '../users/schemas/user.schema';
import { Favorite } from '../favorites/schemas/favorite.schema';

// ** DTOs
import { GroupType } from './dto/registrations-query.dto';

// ** Mocks
const mockUserCountDocuments = jest.fn();
const mockFavoriteCountDocuments = jest.fn();
const mockUserAggregate = jest.fn();

const mockUserModel = {
  countDocuments: mockUserCountDocuments,
  aggregate: mockUserAggregate,
};

const mockFavoriteModel = {
  countDocuments: mockFavoriteCountDocuments,
};

describe('DashboardStatisticsService', () => {
  let service: DashboardStatisticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardStatisticsService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Favorite.name),
          useValue: mockFavoriteModel,
        },
      ],
    }).compile();

    service = module.get<DashboardStatisticsService>(
      DashboardStatisticsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview metrics with calculated growth percentage', async () => {
      mockUserCountDocuments
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(15) // newUsersCurrent
        .mockResolvedValueOnce(10); // newUsersPrev

      mockFavoriteCountDocuments.mockResolvedValueOnce(200); // totalFavorites

      const result = await service.getOverview({
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-07-08T00:00:00.000Z',
      });

      expect(result).toEqual({
        total_users: 100,
        new_users_current_period: 15,
        new_users_growth_percent: 50, // ((15-10)/10)*100
        total_favorites: 200,
      });
      expect(mockUserCountDocuments).toHaveBeenCalledTimes(3);
      expect(mockFavoriteCountDocuments).toHaveBeenCalledTimes(1);
    });

    it('should return growth percent as null when previous period count is zero', async () => {
      mockUserCountDocuments
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(15) // newUsersCurrent
        .mockResolvedValueOnce(0); // newUsersPrev

      mockFavoriteCountDocuments.mockResolvedValueOnce(200); // totalFavorites

      const result = await service.getOverview({
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-07-08T00:00:00.000Z',
      });

      expect(result.new_users_growth_percent).toBeNull();
    });

    it('should throw BadRequestException when from is after to', async () => {
      await expect(
        service.getOverview({
          from: '2026-07-08T00:00:00.000Z',
          to: '2026-06-08T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when from equals to', async () => {
      await expect(
        service.getOverview({
          from: '2026-07-08T00:00:00.000Z',
          to: '2026-07-08T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use half-open interval [$gte from, $lt to] for current period query', async () => {
      mockUserCountDocuments.mockResolvedValue(0);
      mockFavoriteCountDocuments.mockResolvedValue(0);

      await service.getOverview({
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-07-08T00:00:00.000Z',
      });

      // 3rd call is newUsersCurrent — should use $lt not $lte
      const currentPeriodCall = mockUserCountDocuments.mock.calls[1];
      expect(currentPeriodCall[0].createdAt).toHaveProperty('$gte');
      expect(currentPeriodCall[0].createdAt).toHaveProperty('$lt');
      expect(currentPeriodCall[0].createdAt).not.toHaveProperty('$lte');
    });
  });

  describe('getRegistrations', () => {
    it('should return aggregated and zero-filled registration data by day', async () => {
      mockUserAggregate.mockResolvedValue([
        { _id: '2026-06-08', count: 2 },
        { _id: '2026-06-10', count: 1 },
      ]);

      const result = await service.getRegistrations({
        type: GroupType.DAY,
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-06-11T00:00:00.000Z',
      });

      expect(result).toEqual([
        { date: '2026-06-08', count: 2 },
        { date: '2026-06-09', count: 0 },
        { date: '2026-06-10', count: 1 },
      ]);

      expect(mockUserAggregate).toHaveBeenCalledWith([
        {
          $match: {
            isDeleted: { $ne: true },
            createdAt: {
              $gte: new Date('2026-06-08T00:00:00.000Z'),
              $lt: new Date('2026-06-11T00:00:00.000Z'),
            },
          },
        },
        {
          $project: {
            dateStr: {
              $dateToString: {
                date: '$createdAt',
                format: '%Y-%m-%d',
                timezone: 'UTC',
              },
            },
          },
        },
        {
          $group: {
            _id: '$dateStr',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
    });

    it('should zero-fill month and year types correctly', async () => {
      mockUserAggregate.mockResolvedValue([]);

      const resultMonth = await service.getRegistrations({
        type: GroupType.MONTH,
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-04-01T00:00:00.000Z',
      });

      expect(resultMonth).toEqual([
        { date: '2026-01', count: 0 },
        { date: '2026-02', count: 0 },
        { date: '2026-03', count: 0 },
      ]);

      const resultYear = await service.getRegistrations({
        type: GroupType.YEAR,
        from: '2024-01-01T00:00:00.000Z',
        to: '2027-01-01T00:00:00.000Z',
      });

      expect(resultYear).toEqual([
        { date: '2024', count: 0 },
        { date: '2025', count: 0 },
        { date: '2026', count: 0 },
      ]);
    });

    it('should throw BadRequestException when invalid from or to dates are passed', async () => {
      await expect(
        service.getRegistrations({
          type: GroupType.DAY,
          from: 'invalid-date',
          to: '2026-07-08T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getRegistrations({
          type: GroupType.DAY,
          from: '2026-06-08T00:00:00.000Z',
          to: 'invalid-date',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when from is after or equal to to date', async () => {
      await expect(
        service.getRegistrations({
          type: GroupType.DAY,
          from: '2026-07-08T00:00:00.000Z',
          to: '2026-06-08T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getRegistrations({
          type: GroupType.DAY,
          from: '2026-07-08T00:00:00.000Z',
          to: '2026-07-08T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
    it('should use default from/to (last 30 days) when parameters are omitted', async () => {
      mockUserAggregate.mockResolvedValue([]);

      const before = new Date();
      const result = await service.getRegistrations({
        type: GroupType.DAY,
      });
      const after = new Date();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(29);
      expect(result.length).toBeLessThanOrEqual(31);

      // Verify aggregate was called with a date range spanning ~30 days
      const matchStage = mockUserAggregate.mock.calls[0][0][0].$match;
      const fromDate = matchStage.createdAt.$gte;
      const toDate = matchStage.createdAt.$lt;
      const diffMs = toDate.getTime() - fromDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(30, 0);
      expect(toDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(toDate.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });
  });
});
