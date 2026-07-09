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

// ** Enums
import { RoleType } from '../configs/enums/user.enum';

// ** Mocks
const mockUserCountDocuments = jest.fn();
const mockFavoriteCountDocuments = jest.fn();
const mockUserAggregate = jest.fn();
const mockFavoriteAggregate = jest.fn();

const mockUserModel = {
  countDocuments: mockUserCountDocuments,
  aggregate: mockUserAggregate,
};

const mockFavoriteModel = {
  countDocuments: mockFavoriteCountDocuments,
  aggregate: mockFavoriteAggregate,
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

      mockFavoriteAggregate.mockResolvedValueOnce([{ count: 200 }]); // totalFavorites

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
      expect(mockFavoriteAggregate).toHaveBeenCalledTimes(1);

      // Verify role filtering in user count queries
      const totalUsersCall = mockUserCountDocuments.mock.calls[0][0];
      expect(totalUsersCall).toEqual({
        isDeleted: { $ne: true },
        role: { $ne: RoleType.ADMIN },
      });
    });

    it('should return growth percent as null when previous period count is zero', async () => {
      mockUserCountDocuments
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(15) // newUsersCurrent
        .mockResolvedValueOnce(0); // newUsersPrev

      mockFavoriteAggregate.mockResolvedValueOnce([{ count: 200 }]); // totalFavorites

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
      mockFavoriteAggregate.mockResolvedValue([{ count: 0 }]);

      await service.getOverview({
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-07-08T00:00:00.000Z',
      });

      // 3rd call is newUsersCurrent — should use $lt not $lte
      const currentPeriodCall = mockUserCountDocuments.mock.calls[1];
      expect(currentPeriodCall[0].createdAt).toHaveProperty('$gte');
      expect(currentPeriodCall[0].createdAt).toHaveProperty('$lt');
      expect(currentPeriodCall[0].createdAt).not.toHaveProperty('$lte');
      expect(currentPeriodCall[0].role).toEqual({ $ne: RoleType.ADMIN });
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
            role: { $ne: RoleType.ADMIN },
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

  describe('getDemographics', () => {
    it('should aggregate users and group them by age range, zero-filling and sorting in fixed order', async () => {
      mockUserAggregate.mockResolvedValue([
        { _id: '18-25', count: 5 },
        { _id: '36-45', count: 12 },
        { _id: 'Unknown', count: 3 },
      ]);

      const result = await service.getDemographics();

      expect(result).toEqual([
        { group: '<18', count: 0 },
        { group: '18-25', count: 5 },
        { group: '26-35', count: 0 },
        { group: '36-45', count: 12 },
        { group: '>45', count: 0 },
        { group: 'Unknown', count: 3 },
      ]);

      const pipeline = mockUserAggregate.mock.calls[0][0];
      expect(pipeline[0]).toEqual({
        $match: {
          isDeleted: { $ne: true },
          role: { $ne: RoleType.ADMIN },
        },
      });

      expect(pipeline[3]).toEqual({
        $group: {
          _id: '$group',
          count: { $sum: 1 },
        },
      });
    });

    it('should use $isNumber guard for the age field and $ne null for birthday fallback', async () => {
      mockUserAggregate.mockResolvedValue([]);

      await service.getDemographics();

      const pipeline = mockUserAggregate.mock.calls[0][0];
      const ageCondition = pipeline[1].$project.calculatedAge;

      // age branch: checks $ne null AND $isNumber
      const ageIfCondition = ageCondition.$cond.if.$and;
      expect(ageIfCondition).toEqual(
        expect.arrayContaining([
          { $ne: ['$age', null] },
          { $isNumber: '$age' },
        ]),
      );

      // birthday fallback branch: checks $ne null
      const birthdayCondition = ageCondition.$cond.else.$cond;
      expect(birthdayCondition.if.$and).toEqual(
        expect.arrayContaining([{ $ne: ['$birthday', null] }]),
      );

      // final else: null (Unknown)
      expect(birthdayCondition.else).toBeNull();
    });

    it('should route negative calculatedAge to Unknown via $switch guard', async () => {
      mockUserAggregate.mockResolvedValue([]);

      await service.getDemographics();

      const pipeline = mockUserAggregate.mock.calls[0][0];
      const switchBranches = pipeline[2].$project.group.$switch.branches;

      // First branch: null → Unknown
      expect(switchBranches[0]).toEqual({
        case: { $eq: ['$calculatedAge', null] },
        then: 'Unknown',
      });

      // Second branch: negative → Unknown
      expect(switchBranches[1]).toEqual({
        case: { $lt: ['$calculatedAge', 0] },
        then: 'Unknown',
      });

      // Third branch: <18
      expect(switchBranches[2]).toEqual({
        case: { $lt: ['$calculatedAge', 18] },
        then: '<18',
      });
    });

    it('should return all groups with count 0 when db returns empty results', async () => {
      mockUserAggregate.mockResolvedValue([]);

      const result = await service.getDemographics();

      expect(result).toEqual([
        { group: '<18', count: 0 },
        { group: '18-25', count: 0 },
        { group: '26-35', count: 0 },
        { group: '36-45', count: 0 },
        { group: '>45', count: 0 },
        { group: 'Unknown', count: 0 },
      ]);
    });
  });

  describe('getTopGenres', () => {
    it('should aggregate favorites and return top genres list with default limit 10', async () => {
      mockFavoriteAggregate.mockResolvedValue([
        { _id: 'Action', count: 10 },
        { _id: 'Comedy', count: 5 },
      ]);

      const result = await service.getTopGenres();

      expect(result).toEqual([
        { genre: 'Action', count: 10 },
        { genre: 'Comedy', count: 5 },
      ]);
      expect(mockFavoriteAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([{ $limit: 10 }]),
      );

      const pipeline = mockFavoriteAggregate.mock.calls[0][0];
      expect(pipeline).toContainEqual({
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      });
      expect(pipeline).toContainEqual({
        $match: {
          'user.isDeleted': { $ne: true },
          'user.role': { $ne: RoleType.ADMIN },
        },
      });
    });

    it('should clamp limit to 50 if limit is greater than 50', async () => {
      mockFavoriteAggregate.mockResolvedValue([]);

      await service.getTopGenres(100);

      expect(mockFavoriteAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([{ $limit: 50 }]),
      );
    });

  });

  describe('getTopComics', () => {
    it('should aggregate favorites and return top comics list with default limit 10', async () => {
      mockFavoriteAggregate.mockResolvedValue([
        { comic_slug: 'comic-a', comic_name: 'Comic A', count: 10 },
        { comic_slug: 'comic-b', comic_name: 'Comic B', count: 5 },
      ]);

      const result = await service.getTopComics();

      expect(result).toEqual([
        { comic_slug: 'comic-a', comic_name: 'Comic A', count: 10 },
        { comic_slug: 'comic-b', comic_name: 'Comic B', count: 5 },
      ]);
      expect(mockFavoriteAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([{ $limit: 10 }]),
      );

      const pipeline = mockFavoriteAggregate.mock.calls[0][0];
      expect(pipeline).toContainEqual({
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      });
      expect(pipeline).toContainEqual({
        $match: {
          'user.isDeleted': { $ne: true },
          'user.role': { $ne: RoleType.ADMIN },
        },
      });
    });

    it('should clamp limit to 50 if limit is greater than 50', async () => {
      mockFavoriteAggregate.mockResolvedValue([]);

      await service.getTopComics(100);

      expect(mockFavoriteAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([{ $limit: 50 }]),
      );
    });

  });
});
