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

// ** Enums
import { RoleType } from '../configs/enums/user.enum';

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

export interface IDemographicsResult {
  group: string;
  count: number;
}

export interface ITopGenreResult {
  genre: string;
  count: number;
}

export interface ITopComicResult {
  comic_name: string;
  comic_slug: string;
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
        this.userModel.countDocuments({
          isDeleted: { $ne: true },
          role: { $ne: RoleType.ADMIN },
        }),
        this.favoriteModel.aggregate([
          { $match: { isDeleted: { $ne: true } } },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $match: {
              'user.isDeleted': { $ne: true },
              'user.role': { $ne: RoleType.ADMIN },
            },
          },
          { $count: 'count' },
        ]).then((res) => res[0]?.count || 0),
        this.userModel.countDocuments({
          isDeleted: { $ne: true },
          role: { $ne: RoleType.ADMIN },
          createdAt: { $gte: fromDate, $lt: toDate },
        }),
        this.userModel.countDocuments({
          isDeleted: { $ne: true },
          role: { $ne: RoleType.ADMIN },
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
          role: { $ne: RoleType.ADMIN },
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

  async getDemographics(): Promise<IDemographicsResult[]> {
    const currentYear = dayjs().utc().year();

    interface IAggregationResult {
      _id: string;
      count: number;
    }

    const dbResults = await this.userModel.aggregate<IAggregationResult>([
      {
        $match: {
          isDeleted: { $ne: true },
          role: { $ne: RoleType.ADMIN },
        },
      },
      {
        $project: {
          calculatedAge: {
            $cond: {
              if: {
                $and: [{ $ne: ['$age', null] }, { $isNumber: '$age' }],
              },
              then: '$age',
              else: {
                $cond: {
                  if: {
                    $and: [{ $ne: ['$birthday', null] }],
                  },
                  then: {
                    $subtract: [
                      currentYear,
                      { $year: { date: '$birthday', timezone: 'UTC' } },
                    ],
                  },
                  else: null,
                },
              },
            },
          },
        },
      },
      {
        $project: {
          group: {
            $switch: {
              branches: [
                { case: { $eq: ['$calculatedAge', null] }, then: 'Unknown' },
                { case: { $lt: ['$calculatedAge', 0] }, then: 'Unknown' },
                { case: { $lt: ['$calculatedAge', 18] }, then: '<18' },
                {
                  case: {
                    $and: [
                      { $gte: ['$calculatedAge', 18] },
                      { $lte: ['$calculatedAge', 25] },
                    ],
                  },
                  then: '18-25',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$calculatedAge', 26] },
                      { $lte: ['$calculatedAge', 35] },
                    ],
                  },
                  then: '26-35',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$calculatedAge', 36] },
                      { $lte: ['$calculatedAge', 45] },
                    ],
                  },
                  then: '36-45',
                },
              ],
              default: '>45',
            },
          },
        },
      },
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 },
        },
      },
    ]);

    const groupsOrder = ['<18', '18-25', '26-35', '36-45', '>45', 'Unknown'];
    const dbMap = dbResults.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return groupsOrder.map((group) => ({
      group,
      count: dbMap[group] ?? 0,
    }));
  }

  async getTopGenres(limit: number = 10): Promise<ITopGenreResult[]> {
    const clampedLimit = Math.min(limit, 50);
    interface IGenreAggregationResult {
      _id: string;
      count: number;
    }
    const dbResults =
      await this.favoriteModel.aggregate<IGenreAggregationResult>([
        {
          $match: {
            isDeleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $match: {
            'user.isDeleted': { $ne: true },
            'user.role': { $ne: RoleType.ADMIN },
          },
        },
        {
          $lookup: {
            from: 'comics',
            localField: 'comic_slug',
            foreignField: 'slug',
            as: 'comic',
          },
        },
        { $unwind: '$comic' },
        {
          $match: {
            'comic.isDeleted': { $ne: true },
          },
        },
        { $unwind: '$comic.genres' },
        {
          $group: {
            _id: '$comic.genres',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: clampedLimit },
      ]);
    return dbResults.map((row) => ({
      genre: row._id,
      count: row.count,
    }));
  }

  async getTopComics(limit: number = 10): Promise<ITopComicResult[]> {
    const clampedLimit = Math.min(limit, 50);
    const dbResults = await this.favoriteModel.aggregate<ITopComicResult>([
      {
        $match: {
          isDeleted: { $ne: true },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.isDeleted': { $ne: true },
          'user.role': { $ne: RoleType.ADMIN },
        },
      },
      {
        $lookup: {
          from: 'comics',
          localField: 'comic_slug',
          foreignField: 'slug',
          as: 'comic',
        },
      },
      { $unwind: '$comic' },
      {
        $match: {
          'comic.isDeleted': { $ne: true },
        },
      },
      {
        $group: {
          _id: { slug: '$comic.slug', name: '$comic.name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: clampedLimit },
      {
        $project: {
          _id: 0,
          comic_slug: '$_id.slug',
          comic_name: '$_id.name',
          count: 1,
        },
      },
    ]);
    return dbResults;
  }
}
