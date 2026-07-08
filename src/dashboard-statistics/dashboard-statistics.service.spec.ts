// ** NestJS
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** Schemas
import { User } from '../users/schemas/user.schema';
import { Favorite } from '../favorites/schemas/favorite.schema';

// ** Mocks
const mockUserCountDocuments = jest.fn();
const mockFavoriteCountDocuments = jest.fn();

const mockUserModel = {
  countDocuments: mockUserCountDocuments,
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

    service = module.get<DashboardStatisticsService>(DashboardStatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview metrics with calculated growth percentage', async () => {
      mockUserCountDocuments
        .mockResolvedValueOnce(100)  // totalUsers
        .mockResolvedValueOnce(15)   // newUsersCurrent
        .mockResolvedValueOnce(10);  // newUsersPrev

      mockFavoriteCountDocuments
        .mockResolvedValueOnce(200); // totalFavorites

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
        .mockResolvedValueOnce(15)  // newUsersCurrent
        .mockResolvedValueOnce(0);  // newUsersPrev

      mockFavoriteCountDocuments
        .mockResolvedValueOnce(200); // totalFavorites

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
});
