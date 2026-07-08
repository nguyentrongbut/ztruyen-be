// ** NestJS
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ** Controller
import { DashboardStatisticsController } from './dashboard-statistics.controller';

// ** Service
import { DashboardStatisticsService } from './dashboard-statistics.service';

// ** Schemas
import { User, UserSchema } from '../users/schemas/user.schema';
import { Favorite, FavoriteSchema } from '../favorites/schemas/favorite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  controllers: [DashboardStatisticsController],
  providers: [DashboardStatisticsService],
  exports: [DashboardStatisticsService],
})
export class DashboardStatisticsModule {}
