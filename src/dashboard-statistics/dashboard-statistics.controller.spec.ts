// ** NestJS
import { Test, TestingModule } from '@nestjs/testing';

// ** Controller
import { DashboardStatisticsController } from './dashboard-statistics.controller';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** DTOs
import { GroupType } from './dto/registrations-query.dto';

// ** Mocks
const mockOverviewData = {
  total_users: 100,
  new_users_current_period: 15,
  new_users_growth_percent: 50,
  total_favorites: 200,
};

const mockRegistrationsData = [
  { date: '2026-06-08', count: 5 },
  { date: '2026-06-09', count: 0 },
  { date: '2026-06-10', count: 2 },
];

const mockDemographicsData = [
  { group: '<18', count: 1 },
  { group: '18-25', count: 2 },
  { group: '26-35', count: 3 },
  { group: '36-45', count: 4 },
  { group: '>45', count: 5 },
  { group: 'Unknown', count: 6 },
];

const mockStatsService = {
  getOverview: jest.fn().mockResolvedValue(mockOverviewData),
  getRegistrations: jest.fn().mockResolvedValue(mockRegistrationsData),
  getDemographics: jest.fn().mockResolvedValue(mockDemographicsData),
};

describe('DashboardStatisticsController', () => {
  let controller: DashboardStatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardStatisticsController],
      providers: [
        {
          provide: DashboardStatisticsService,
          useValue: mockStatsService,
        },
      ],
    }).compile();

    controller = module.get<DashboardStatisticsController>(
      DashboardStatisticsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return metrics inside standard response envelope', async () => {
      const query = {
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-07-08T00:00:00.000Z',
      };
      const response = await controller.getOverview(query);

      expect(response).toEqual({
        data: mockOverviewData,
        meta: {
          generated_at: expect.any(String),
        },
      });
      expect(mockStatsService.getOverview).toHaveBeenCalledWith(query);
    });
  });

  describe('getRegistrations', () => {
    it('should return registrations list inside standard response envelope', async () => {
      const query = {
        type: GroupType.DAY,
        from: '2026-06-08T00:00:00.000Z',
        to: '2026-06-10T00:00:00.000Z',
      };
      const response = await controller.getRegistrations(query);

      expect(response).toEqual({
        data: mockRegistrationsData,
        meta: {
          generated_at: expect.any(String),
        },
      });
      expect(mockStatsService.getRegistrations).toHaveBeenCalledWith(query);
    });
  });

  describe('getDemographics', () => {
    it('should return user age demographics distribution inside standard response envelope', async () => {
      const response = await controller.getDemographics();

      expect(response).toEqual({
        data: mockDemographicsData,
        meta: {
          generated_at: expect.any(String),
        },
      });
      expect(mockStatsService.getDemographics).toHaveBeenCalled();
    });
  });
});
