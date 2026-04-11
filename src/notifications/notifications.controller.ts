// ** NestJS
import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Res,
  Sse, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

// ** RxJS
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ** Services
import { NotificationsService } from './notifications.service';

// ** Decorators
import { ResponseMessage, User } from '../decorator/customize';

// ** Interfaces
import { IUser } from '../users/users.interface';

// ** Guards
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('notification')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('notification')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
  ) {}

  @Get()
  @ResponseMessage('Lấy danh sách thông báo thành công')
  @ApiOperation({ summary: 'Danh sách thông báo cá nhân — cần đăng nhập' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getMyNotifications(
    @User() user: IUser,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.service.getMyNotifications(user._id, +page, +limit);
  }

  @Patch('read-all')
  @ResponseMessage('Đánh dấu tất cả đã đọc')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  markAllAsRead(@User() user: IUser) {
    return this.service.markAsRead(user._id);
  }

  @Patch(':id')
  @ResponseMessage('Đánh dấu đã đọc')
  @ApiOperation({ summary: 'Đánh dấu 1 thông báo là đã đọc' })
  markOneAsRead(@Param('id') id: string, @User() user: IUser) {
    return this.service.markAsRead(user._id, id);
  }

  @Delete('all')
  @ResponseMessage('Xóa tất cả thông báo thành công')
  @ApiOperation({ summary: 'Xóa tất cả thông báo của bản thân' })
  deleteAll(@User() user: IUser) {
    return this.service.deleteAll(user._id);
  }

  @Delete(':id')
  @ResponseMessage('Xóa thông báo thành công')
  @ApiOperation({ summary: 'Xóa 1 thông báo' })
  deleteOne(@Param('id') id: string, @User() user: IUser) {
    return this.service.deleteOne(user._id, id);
  }
}