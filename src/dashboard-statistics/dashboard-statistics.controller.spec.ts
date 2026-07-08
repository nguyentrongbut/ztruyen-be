// ** NestJS
import { Test, TestingModule } from '@nestjs/testing';

// ** Controller
import { DashboardStatisticsController } from './dashboard-statistics.controller';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** Mocks
const mockOverviewData = {
  total_users: 100,
  new_users_current_period: 15,
  new_users_growth_percent: 50,
  total_favorites: 200,
};

const mockStatsService = {
  getOverview: jest.fn().mockResolvedValue(mockOverviewData),
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

    controller = module.get<DashboardStatisticsController>(DashboardStatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return metrics inside standard response envelope', async () => {
      const query = { from: '2026-06-08T00:00:00.000Z', to: '2026-07-08T00:00:00.000Z' };
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
});
