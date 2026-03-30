import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { EmojiCategoriesService } from './emoji-categories.service';
import { CreateEmojiCategoryDto } from './dto/create-emoji-category.dto';
import { UpdateEmojiCategoryDto } from './dto/update-emoji-category.dto';
import { ReorderEmojiCategoryDto } from './dto/reorder-emoji-category.dto';
import { ResponseMessage } from '../decorator/customize';
import { Roles } from '../decorator/roles.decorator';
import { RoleType } from '../configs/enums/user.enum';
import { Emoji } from '../emojis/schemas/emoji.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EMOJI_CATEGORY_MESSAGES } from '../configs/messages/emoji-category.message';

@ApiTags('emoji-category')
@ApiBearerAuth('access-token')
@Controller('emoji-category')
export class EmojiCategoriesController {
  constructor(
    private readonly service: EmojiCategoriesService,
    @InjectModel(Emoji.name) private emojiModel: Model<any>,
  ) {}

  @Get()
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({ summary: 'Lấy danh sách category active' })
  getAll(
    @Query() qs: string,
  ) {
    return this.service.getAll(qs);
  }

  /* ================= ADMIN ================= */

  @Get('admin')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({ summary: 'Admin lấy tất cả category' })
  @ApiQuery({ name: 'search', required: false })
  adminGetAll(
    @Query() qs: string,
  ) {
    return this.service.adminGetAll(qs);
  }

  @Post('admin')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.CREATE_SUCCESS)
  @ApiOperation({ summary: 'Admin tạo category' })
  create(@Body() dto: CreateEmojiCategoryDto) {
    return this.service.create(dto);
  }

  @Get('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.GET_ONE_SUCCESS)
  @ApiOperation({ summary: 'Admin xem chi tiết category' })
  getOne(@Param('id') id: string) {
    return this.service.adminGetOne(id);
  }

  @Patch('admin/reorder')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.REORDER_SUCCESS)
  @ApiOperation({ summary: 'Admin sắp xếp thứ tự category' })
  reorder(@Body() dto: ReorderEmojiCategoryDto) {
    return this.service.reorder(dto);
  }

  @Patch('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.UPDATE_SUCCESS)
  @ApiOperation({ summary: 'Admin sửa category' })
  update(@Param('id') id: string, @Body() dto: UpdateEmojiCategoryDto) {
    return this.service.update(id, dto);
  }

  @Patch('admin/:id/toggle')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.TOGGLE_SUCCESS)
  @ApiOperation({ summary: 'Admin bật/tắt category' })
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }

  @Delete('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(EMOJI_CATEGORY_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({
    summary: 'Admin xóa category (chỉ xóa được khi không có emoji)',
  })
  delete(@Param('id') id: string) {
    return this.service.delete(id, this.emojiModel);
  }
}
