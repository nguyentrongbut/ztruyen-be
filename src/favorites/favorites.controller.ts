// ** Nestjs
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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
Sắp xếp kết quả:
- createdAt (tăng dần)
- -createdAt (giảm dần)
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
}
