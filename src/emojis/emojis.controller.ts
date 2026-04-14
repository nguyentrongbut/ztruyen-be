import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { EmojisService } from './emojis.service';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';
import { BulkDeleteEmojiDto } from './dto/bulk-delete-emoji.dto';
import { ResponseMessage } from '../decorator/customize';
import { Roles } from '../decorator/roles.decorator';
import { RoleType } from '../configs/enums/user.enum';
import { EMOJI_MESSAGES } from '../configs/messages/emoji.message';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('emoji')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('emoji')
export class EmojisController {
  constructor(private readonly service: EmojisService) {}

  @Get()
  @ResponseMessage(EMOJI_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({ summary: 'Lấy danh sách emoji cho picker' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'category', required: false })
  getAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.service.getAll(+page, +limit, qs);
  }

  /* ================= ADMIN ================= */

  @Get('admin')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({ summary: 'Admin lấy tất cả emoji' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  adminGetAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.service.adminGetAll(+page, +limit, qs);
  }

  @Get('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.GET_ONE_SUCCESS)
  @ApiOperation({ summary: 'Admin xem chi tiết emoji' })
  getOne(@Param('id') id: string) {
    return this.service.adminGetOne(id);
  }

  @Post('admin')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.CREATE_SUCCESS)
  @ApiOperation({ summary: 'Admin tạo emoji' })
  create(@Body() dto: CreateEmojiDto) {
    return this.service.create(dto);
  }

  @Delete('admin/delete-multi')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.BULK_DELETE_SUCCESS)
  @ApiOperation({ summary: 'Admin xóa nhiều emoji' })
  bulkDelete(@Body() dto: BulkDeleteEmojiDto) {
    return this.service.bulkDelete(dto);
  }

  @Delete('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({ summary: 'Admin xóa một emoji' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.UPDATE_SUCCESS)
  @ApiOperation({ summary: 'Admin sửa emoji' })
  update(@Param('id') id: string, @Body() dto: UpdateEmojiDto) {
    return this.service.update(id, dto);
  }

  @Patch('admin/:id/toggle')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_MESSAGES.TOGGLE_SUCCESS)
  @ApiOperation({ summary: 'Admin bật/tắt emoji' })
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }
}
