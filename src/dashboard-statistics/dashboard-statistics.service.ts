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
import {
  Favorite,
  FavoriteDocument,
} from '../favorites/schemas/favorite.schema';

// ** DTOs
import { OverviewQueryDto } from './dto/overview-query.dto';
import {
  RegistrationsQueryDto,
  GroupType,
} from './dto/registrations-query.dto';

dayjs.extend(utc);

export interface IOverviewResult {
  total_users: number;
  new_users_current_period: number;
  new_users_growth_percent: number | null;
  total_favorites: number;
}

export interface IRegistrationsResult {
  date: string;
  count: number;
}

@Injectable()
export class DashboardStatisticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
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

    const [totalUsers, totalFavorites, newUsersCurrent, newUsersPrev] =
      await Promise.all([
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

  async getRegistrations(
    query: RegistrationsQueryDto,
  ): Promise<IRegistrationsResult[]> {
    const fromStr = query.from || dayjs().subtract(30, 'day').toISOString();
    const toStr = query.to || dayjs().toISOString();

    const fromDayjs = dayjs(fromStr).utc();
    const toDayjs = dayjs(toStr).utc();

    // Defense-in-depth: @IsDateString() on the DTO is the primary format guard.
    // dayjs(...).isValid() is lenient and may accept some malformed strings.
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

    const mongoFormatMap = {
      [GroupType.DAY]: '%Y-%m-%d',
      [GroupType.MONTH]: '%Y-%m',
      [GroupType.YEAR]: '%Y',
    };

    const dbResults = await this.userModel.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          createdAt: { $gte: fromDate, $lt: toDate },
        },
      },
      {
        $project: {
          dateStr: {
            $dateToString: {
              date: '$createdAt',
              format: mongoFormatMap[query.type],
              timezone: 'UTC',
            },
          },
        },
      },
      {
        $group: {
          _id: '$dateStr',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dbMap: Record<string, number> = {};
    for (const row of dbResults) {
      if (row._id) {
        dbMap[row._id] = row.count;
      }
    }

    const formatMap = {
      [GroupType.DAY]: 'YYYY-MM-DD',
      [GroupType.MONTH]: 'YYYY-MM',
      [GroupType.YEAR]: 'YYYY',
    };

    const result: IRegistrationsResult[] = [];
    // Zero-filling: start at the beginning of the first bucket (e.g. 1st of the month
    // for type=month). This means the first bucket label may cover dates before `from`
    // that are excluded from the DB query's [from, to) window. This is by-design per
    // the spec's zero-filling algorithm to produce clean calendar-aligned labels.
    let cursor = fromDayjs.clone().startOf(query.type);
    while (cursor.isBefore(toDayjs)) {
      const dateStr = cursor.format(formatMap[query.type]);
      result.push({
        date: dateStr,
        count: dbMap[dateStr] || 0,
      });
      cursor = cursor.add(1, query.type);
    }

    return result;
  }
}
