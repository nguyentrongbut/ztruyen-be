// ** NestJS
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** DTOs
import { OverviewQueryDto } from './dto/overview-query.dto';

// ** Guards
import { RolesGuard } from '../guards/roles.guard';

// ** Decorators
import { Roles } from '../decorator/roles.decorator';
import { ResponseMessage } from '../decorator/customize';

// ** Enums
import { RoleType } from '../configs/enums/user.enum';

// ** Messages
import { DASHBOARD_STATISTICS_MESSAGES } from '../configs/messages/dashboard-statistics.message';

@ApiTags('dashboard-statistics')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('dashboard-statistics')
export class DashboardStatisticsController {
  constructor(private readonly statsService: DashboardStatisticsService) {}

  @Get('overview')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(DASHBOARD_STATISTICS_MESSAGES.GET_OVERVIEW_SUCCESS)
  @ApiOperation({ summary: 'Lấy số liệu tổng quan và tăng trưởng người dùng đăng ký mới' })
  async getOverview(@Query() query: OverviewQueryDto) {
    const data = await this.statsService.getOverview(query);
    return {
      data,
      meta: {
        generated_at: new Date().toISOString(),
      },
    };
  }
}
