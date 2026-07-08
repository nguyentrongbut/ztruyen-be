// ** NestJS
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** DTOs
import { OverviewQueryDto } from './dto/overview-query.dto';
import { RegistrationsQueryDto } from './dto/registrations-query.dto';
import { TopLimitQueryDto } from './dto/top-limit-query.dto';

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
  @ApiOperation({
    summary: 'Lấy số liệu tổng quan và tăng trưởng người dùng đăng ký mới',
  })
  async getOverview(@Query() query: OverviewQueryDto) {
    const data = await this.statsService.getOverview(query);
    return {
      data,
      meta: {
        generated_at: new Date().toISOString(),
      },
    };
  }

  @Get('registrations')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(DASHBOARD_STATISTICS_MESSAGES.GET_REGISTRATIONS_SUCCESS)
  @ApiOperation({
    summary: 'Lấy số liệu đăng ký người dùng theo ngày, tháng, năm',
  })
  async getRegistrations(@Query() query: RegistrationsQueryDto) {
    const data = await this.statsService.getRegistrations(query);
    return {
      data,
      meta: {
        generated_at: new Date().toISOString(),
      },
    };
  }

  @Get('demographics')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(DASHBOARD_STATISTICS_MESSAGES.GET_DEMOGRAPHICS_SUCCESS)
  @ApiOperation({
    summary: 'Lấy số liệu nhân khẩu học độ tuổi của người dùng',
  })
  async getDemographics() {
    const data = await this.statsService.getDemographics();
    return {
      data,
      meta: {
        generated_at: new Date().toISOString(),
      },
    };
  }

  @Get('top-genres')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(DASHBOARD_STATISTICS_MESSAGES.GET_TOP_GENRES_SUCCESS)
  @ApiOperation({
    summary: 'Lấy danh sách thể loại yêu thích hàng đầu',
  })
  async getTopGenres(@Query() query: TopLimitQueryDto) {
    const data = await this.statsService.getTopGenres(query.limit);
    return {
      data,
      meta: {
        generated_at: new Date().toISOString(),
      },
    };
  }

  @Get('top-comics')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(DASHBOARD_STATISTICS_MESSAGES.GET_TOP_COMICS_SUCCESS)
  @ApiOperation({
    summary: 'Lấy danh sách truyện yêu thích hàng đầu',
  })
  async getTopComics(@Query() query: TopLimitQueryDto) {
    const data = await this.statsService.getTopComics(query.limit);
    return {
      data,
      meta: {
        generated_at: new Date().toISOString(),
      },
    };
  }
}
