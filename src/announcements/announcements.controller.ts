// ** NestJS
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query, UseGuards,
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
import { RemoveManyAnnouncementDto } from './dto/remove-many-announcement.dto';
import { ANNOUNCEMENT_MESSAGES } from '../configs/messages/announcement.message';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('announcement')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('announcement')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  // ── Public — không cần đăng nhập ───────────────────────────

  @Public()
  @Get('active')
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.GET_ACTIVE)
  @ApiOperation({
    summary: 'Lấy thông báo toàn hệ thống đang active — không cần đăng nhập',
    description: `
Gọi 1 lần khi mở app.
Trả về null nếu không có thông báo active.

Client xử lý theo type:
- info        → badge xanh dương
- warning     → badge vàng  
- maintenance → block UI
- event       → badge xanh lá
`,
  })
  getActive() {
    return this.service.getActive();
  }

  // ── Admin — cần đăng nhập + role ADMIN ─────────────────────

  @Post()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.CREATE)
  @ApiOperation({
    summary: 'Admin tạo thông báo toàn hệ thống',
  })
  create(@Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.FIND_ALL)
  @ApiOperation({ summary: 'Admin xem tất cả thông báo' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'qs',
    required: false,
    description: `
Hỗ trợ filter động qua query string (title, type, isActive, createdAt).

Ví dụ:
- /announcement?title=bảo trì
- /announcement?type=maintenance
- /announcement?isActive=true
- /announcement?sort=-createdAt
- /announcement?search=bảo trì
`,
  })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.service.findAll(+page, +limit, qs);
  }

  @Get(':id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.FIND_ONE)
  @ApiOperation({ summary: 'Admin xem chi tiết thông báo' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.UPDATE)
  @ApiOperation({ summary: 'Admin cập nhật thông báo' })
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.TOGGLE)
  @ApiOperation({
    summary: 'Admin bật/tắt nhanh thông báo',
  })
  toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.REMOVE)
  @ApiOperation({ summary: 'Admin xóa thông báo' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(ANNOUNCEMENT_MESSAGES.REMOVE_MANY)
  @ApiOperation({
    summary: 'Admin xóa nhiều thông báo',
  })
  removeMany(@Body() dto: RemoveManyAnnouncementDto) {
    return this.service.removeMany(dto.ids);
  }
}
