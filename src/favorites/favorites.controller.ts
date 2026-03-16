// ** Nestjs
import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

// ** Service
import { FavoritesService } from './favorites.service';

// ** DTO
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

// ** Interface
import { IUser } from '../users/users.interface';

// ** Decorator
import { ResponseMessage, User } from '../decorator/customize';

// ** Message
import { FAVORITE_MESSAGES } from '../configs/messages/favorite.message';
import { DeleteMultiFavoriteDto } from './dto/delete-multi-favorite.dto';

@ApiTags('favorite')
@ApiBearerAuth('access-token')
@Controller('favorite')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle')
  @ResponseMessage(FAVORITE_MESSAGES.TOGGLE_SUCCESS)
  @ApiOperation({
    summary: 'Thêm hoặc bỏ yêu thích truyện',
  })
  toggleFavorite(@Body() dto: ToggleFavoriteDto, @User() user: IUser) {
    return this.favoritesService.toggleFavorite(user._id, dto);
  }

  @Get()
  @ResponseMessage(FAVORITE_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({
    summary: 'Lấy danh sách truyện yêu thích của user',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: `
Hỗ trợ filter động trực tiếp qua query string(comic_name, createdAt, updatedAt).

Ví dụ:
- /frame?comic_name=tienkiemkihiep
- /frame?sort=-comic_name
- /frame?search=tienk
- /frame?createdAt=2026-01-25T11:30:41.401Z&createdAt<=2026-02-15T14:50:27.251Z
- /frame?comic_name=tienkiemkihiep&sort=name
`,
  })
  getFavorites(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
    @User() user: IUser,
  ) {
    return this.favoritesService.getFavorites(+page, +limit, qs, user._id);
  }

  @Get('check/:slug')
  @ResponseMessage(FAVORITE_MESSAGES.CHECK_SUCCESS)
  @ApiOperation({
    summary: 'Kiểm tra truyện đã được yêu thích chưa',
  })
  checkFavorite(@Param('slug') slug: string, @User() user: IUser) {
    return this.favoritesService.checkFavorite(user._id, slug);
  }

  @Delete(':id')
  @ResponseMessage(FAVORITE_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({
    summary: 'Xóa truyện khỏi danh sách yêu thích',
  })
  deleteFavorite(@Param('id') id: string, @User() user: IUser) {
    return this.favoritesService.deleteFavorite(id, user._id);
  }

  @Delete('delete-multi')
  @ResponseMessage(FAVORITE_MESSAGES.DELETE_MULTI_SUCCESS)
  @ApiOperation({
    summary: 'Xóa nhiều truyện yêu thích',
  })
  deleteMultiFavorite(
    @Body() dto: DeleteMultiFavoriteDto,
    @User() user: IUser,
  ) {
    return this.favoritesService.deleteMultiFavorite(dto.ids, user._id);
  }
}
