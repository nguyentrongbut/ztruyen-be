// ** NestJs
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ** Services
import { UsersService } from './users.service';

// ** Controllers
import { UsersController } from './users.controller';

// ** Schemas
import { User, UserSchema } from './schemas/user.schema';

// ** Modules
import { ImagesModule } from '../images/images.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    ImagesModule,
    FirebaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
