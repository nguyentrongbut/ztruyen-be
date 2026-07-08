// ** NestJS
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// ** Mongoose
import { Model } from 'mongoose';

// ** Dayjs
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// ** Schemas
import { User, UserDocument } from '../users/schemas/user.schema';
import { Favorite, FavoriteDocument } from '../favorites/schemas/favorite.schema';

// ** DTOs
import { OverviewQueryDto } from './dto/overview-query.dto';

dayjs.extend(utc);

export interface IOverviewResult {
  total_users: number;
  new_users_current_period: number;
  new_users_growth_percent: number | null;
  total_favorites: number;
}

@Injectable()
export class DashboardStatisticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<FavoriteDocument>,
  ) {}

  async getOverview(query: OverviewQueryDto): Promise<IOverviewResult> {
    const fromStr = query.from || dayjs().subtract(30, 'day').toISOString();
    const toStr = query.to || dayjs().toISOString();

    const fromDayjs = dayjs(fromStr).utc();
    const toDayjs = dayjs(toStr).utc();

    if (!fromDayjs.isValid()) {
      throw new BadRequestException('Invalid `from` date');
    }
    if (!toDayjs.isValid()) {
      throw new BadRequestException('Invalid `to` date');
    }

    const fromDate = fromDayjs.toDate();
    const toDate = toDayjs.toDate();

    if (fromDate >= toDate) {
      throw new BadRequestException('`from` must be strictly before `to`');
    }

    const durationMs = toDate.getTime() - fromDate.getTime();
    const fromPrevDate = new Date(fromDate.getTime() - durationMs);
    const toPrevDate = fromDate;

    const [totalUsers, totalFavorites, newUsersCurrent, newUsersPrev] = await Promise.all([
      this.userModel.countDocuments({ isDeleted: { $ne: true } }),
      this.favoriteModel.countDocuments({ isDeleted: { $ne: true } }),
      this.userModel.countDocuments({
        isDeleted: { $ne: true },
        createdAt: { $gte: fromDate, $lt: toDate },
      }),
      this.userModel.countDocuments({
        isDeleted: { $ne: true },
        createdAt: { $gte: fromPrevDate, $lt: toPrevDate },
      }),
    ]);

    let growthPercent: number | null = null;
    if (newUsersPrev > 0) {
      growthPercent = parseFloat(
        (((newUsersCurrent - newUsersPrev) / newUsersPrev) * 100).toFixed(1),
      );
    }

    return {
      total_users: totalUsers,
      new_users_current_period: newUsersCurrent,
      new_users_growth_percent: growthPercent,
      total_favorites: totalFavorites,
    };
  }
}
