// ** NestJS
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

// ** Services
import { AnnouncementsService } from './announcements.service';

// ** DTOs
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

// ** Decorators
import { Public, ResponseMessage } from '../decorator/customize';
import { Roles } from '../decorator/roles.decorator';

// ** Enums
import { RoleType } from '../configs/enums/user.enum';

@ApiTags('announcement')
@ApiBearerAuth('access-token')
@Controller('announcement')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  // ── Public — không cần đăng nhập ───────────────────────────

  @Public()
  @Get('active')
  @ResponseMessage('Lấy thông báo thành công')
  @ApiOperation({
    summary: 'Lấy thông báo toàn hệ thống đang active — không cần đăng nhập',
    description: `
Gọi 1 lần khi mở app.
Trả về null nếu không có thông báo active.

Client xử lý theo type:
- info        → banner xanh dương
- warning     → banner vàng  
- maintenance → popup đỏ, có thể block UI
- event       → banner xanh lá
`,
  })
  getActive() {
    return this.service.getActive();
  }

  // ── Admin — cần đăng nhập + role ADMIN ─────────────────────

  @Post()
  @Roles(RoleType.ADMIN)
  @ResponseMessage('Tạo thông báo thành công')
  @ApiOperation({
    summary: 'Admin tạo thông báo toàn hệ thống',
    description: 'Tự động gửi FCM push đến toàn bộ user khi tạo.',
  })
  create(@Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(RoleType.ADMIN)
  @ResponseMessage('Lấy danh sách thông báo thành công')
  @ApiOperation({ summary: 'Admin xem tất cả thông báo' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    return this.service.findAll(+page, +limit);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage('Cập nhật thông báo thành công')
  @ApiOperation({ summary: 'Admin cập nhật thông báo' })
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @Roles(RoleType.ADMIN)
  @ResponseMessage('Thay đổi trạng thái thành công')
  @ApiOperation({
    summary: 'Admin bật/tắt nhanh thông báo',
    description: 'Nếu vừa bật → tự động gửi FCM push ngay.',
  })
  toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage('Xóa thông báo thành công')
  @ApiOperation({ summary: 'Admin xóa thông báo' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}