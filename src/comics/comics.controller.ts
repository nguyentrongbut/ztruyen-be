import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

// ** Service
import { ComicsService } from './comics.service';

// ** DTOs
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';

// ** Guards & Roles
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { RoleType } from '../configs/enums/user.enum';

// ** Decorators
import { Public, ResponseMessage } from '../decorator/customize';

// ** Messages
import { COMIC_MESSAGES } from '../configs/messages/comic.message';
import { BulkDeleteComicDto } from './dto/bulk-delete-comic.dto';
import { BulkCreateComicDto } from './dto/bulk-create-comic.dto';

@ApiTags('comics')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('comic')
export class ComicsController {
  constructor(private readonly comicsService: ComicsService) {}

  /* ================= PUBLIC ================= */

  @Public()
  @Get()
  @ResponseMessage(COMIC_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({ summary: 'Lấy danh sách / BXH truyện (public)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  findAllComic(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.comicsService.findAllComic(+page, +limit, qs);
  }

  /* ================= ADMIN ================= */

  @Get('admin')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(COMIC_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({ summary: 'Admin lấy tất cả truyện' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.comicsService.findAll(+page, +limit, qs);
  }

  @Get('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(COMIC_MESSAGES.GET_ONE_SUCCESS)
  @ApiOperation({ summary: 'Admin xem chi tiết truyện' })
  findOne(@Param('id') id: string) {
    return this.comicsService.findOne(id);
  }

  @Post('admin')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(COMIC_MESSAGES.CREATE_SUCCESS)
  @ApiOperation({ summary: 'Admin tạo truyện' })
  create(@Body() createComicDto: CreateComicDto) {
    return this.comicsService.create(createComicDto);
  }

  @Patch('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(COMIC_MESSAGES.UPDATE_SUCCESS)
  @ApiOperation({ summary: 'Admin cập nhật truyện' })
  update(@Param('id') id: string, @Body() updateComicDto: UpdateComicDto) {
    return this.comicsService.update(id, updateComicDto);
  }

  @Delete('admin/delete-multi')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(COMIC_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({ summary: 'Admin xóa nhiều truyện' })
  bulkDelete(@Body() dto: BulkDeleteComicDto) {
    return this.comicsService.bulkDelete(dto);
  }

  @Delete('admin/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(COMIC_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({ summary: 'Admin xóa truyện' })
  remove(@Param('id') id: string) {
    return this.comicsService.remove(id);
  }

  @Post('admin/import')
  @Roles(RoleType.ADMIN)
  @ResponseMessage('Import truyện thành công')
  @ApiOperation({ summary: 'Admin import nhiều truyện từ JSON' })
  bulkCreate(@Body() dto: BulkCreateComicDto) {
    return this.comicsService.bulkCreate(dto);
  }
}
