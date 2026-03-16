// ** NestJs
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// ** Schemas
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';

// ** Mongoose
import { Model } from 'mongoose';

// ** DTO
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

// ** api query params
import aqp from 'api-query-params';

// ** Util
import { removeVietnameseTones } from '../utils/removeVietnameseTones';
import { FAVORITE_MESSAGES } from '../configs/messages/favorite.message';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private favoriteModel: Model<FavoriteDocument>,
  ) {}

  async toggleFavorite(userId: string, dto: ToggleFavoriteDto) {
    const existed = await this.favoriteModel.findOne({
      userId,
      comic_slug: dto.comic_slug,
    });

    // favorite → remove
    if (existed) {
      await this.favoriteModel.deleteOne({
        userId,
        comic_slug: dto.comic_slug,
      });

      return {
        isFavorite: false,
      };
    }

    // add
    await this.favoriteModel.create({
      userId,
      ...dto,
      comic_name_unsigned: removeVietnameseTones(dto.comic_name),
    });

    return {
      isFavorite: true,
    };
  }

  async getFavorites(page: number, limit: number, qs: string, userId: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    filter.userId = userId;

    const keyword = filter.search;

    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);

      const regex = unsigned.trim().split(/\s+/).join('.*');

      filter.comic_name_unsigned = {
        $regex: regex,
        $options: 'i',
      };

      delete filter.search;
    }

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.favoriteModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.favoriteModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .select('-userId -isDeleted -deletedAt')
      .exec();

    return {
      meta: {
        page,
        limit: defaultLimit,
        totalPages,
        totalItems,
      },
      result,
    };
  }

  async checkFavorite(userId: string, slug: string) {
    const exist = await this.favoriteModel.findOne({
      userId,
      comic_slug: slug,
    });

    return {
      isFavorite: !!exist,
    };
  }

  async deleteFavorite(id: string, userId: string) {
    const result = await this.favoriteModel.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!result) {
      throw new NotFoundException(FAVORITE_MESSAGES.NOT_FOUND);
    }

    return {
      deleted: true,
    };
  }

  async deleteMultiFavorite(ids: string[], userId: string) {
    const favorites = await this.favoriteModel.find({
      _id: { $in: ids },
      userId,
    });

    if (!favorites.length) {
      throw new NotFoundException(FAVORITE_MESSAGES.NOT_FOUND);
    }

    const validIds = favorites.map((item) => item._id);

    await this.favoriteModel.deleteMany({
      _id: { $in: validIds },
    });

    return {
      deletedCount: validIds.length,
    };
  }
}
