// ** NestJs
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Response } from 'express';

// ** Services
import { UsersService } from './users.service';

// ** DTO
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RestoreAndDeleteMultiDto } from './dto/restore-and-delete-multi.dto';

// ** Decorator
import { ResponseMessage, User } from '../decorator/customize';
import { Roles } from '../decorator/roles.decorator';

// ** Guard
import { RolesGuard } from '../guards/roles.guard';

// ** Interface
import { IUser } from './users.interface';

// ** Messages
import { USERS_MESSAGES } from '../configs/messages/user.message';

// ** Enum
import { RoleType } from '../configs/enums/user.enum';
import { FileInterceptor } from '@nestjs/platform-express';

// ** Swagger
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.CREATE_SUCCESS)
  @ApiOperation({
    summary: 'Tạo mới người dùng (Chỉ Admin có quyền)',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({
    summary: 'Danh sách người dùng (Chỉ Admin có quyền)',
    description: `
Hỗ trợ filter động trực tiếp qua query string(email, name, age, gender, birthday, role, provider, createdAt, updatedAt).

Ví dụ:
- /users?role=admin
- /users?sort=-age
- /users?name=/cloly/i
- /users?age=20&age<=25
- /users?age>=20&age<=25
- /users?role=user&gender=male&sort=name
`,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: `
Sắp xếp kết quả:
- age (tăng dần)
- -age (giảm dần)
`,
  })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
    @Req() req,
  ) {
    const currentUserId = req.user._id;
    return this.usersService.findAll(+page, +limit, qs, currentUserId);
  }

  @Get('detail/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.GET_DETAIL_SUCCESS)
  @ApiOperation({
    summary: 'Thông tin người dùng (Chỉ Admin có quyền)',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('profile')
  @ResponseMessage(USERS_MESSAGES.GET_PROFILE_SUCCESS)
  @ApiOperation({
    summary: 'Thông tin cá nhân',
  })
  findProfile(@User() user: IUser) {
    return this.usersService.findProfile(user);
  }

  @Patch('profile')
  @ResponseMessage(USERS_MESSAGES.UPDATE_PROFILE_SUCCESS)
  @ApiOperation({
    summary: 'Cập nhật thông tin cá nhân',
  })
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @User() user: IUser) {
    return this.usersService.updateProfile(updateProfileDto, user);
  }

  @Patch('update/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.UPDATE_SUCCESS)
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng (Chỉ Admin có quyền)',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('delete/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({
    summary: 'Xoá mềm người dùng (Chỉ Admin có quyền)',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete('delete-multi')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.DELETE_MULTI_SUCCESS)
  @ApiOperation({
    summary: 'Xoá mềm nhiều người dùng (Chỉ Admin có quyền)',
  })
  removeMulti(@Body() dto: RestoreAndDeleteMultiDto) {
    return this.usersService.removeMulti(dto.ids);
  }

  @Get('trash')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.GET_TRASH_SUCCESS)
  @ApiOperation({
    summary: 'Danh sách người dùng đã xoá (Chỉ Admin có quyền)',
    description: `
Hỗ trợ filter động trực tiếp qua query string(email, name, age, gender, birthday, role, provider, createdAt, updatedAt).

Ví dụ:
- /users?role=admin
- /users?sort=-age
- /users?name=/cloly/i
- /users?age=20&age<=25
- /users?age>=20&age<=25
- /users?role=user&gender=male&sort=name
`,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: `
Sắp xếp kết quả:
- age (tăng dần)
- -age (giảm dần)
`,
  })
  findDeleted(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.usersService.findDeleted(+page, +limit, qs);
  }

  @Get('trash/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.GET_TRASH_DETAIL_SUCCESS)
  @ApiOperation({
    summary: 'Thông tin người dùng đã xoá (Chỉ Admin có quyền)',
  })
  findOneDeleted(@Param('id') id: string) {
    return this.usersService.findOneDeleted(id);
  }

  @Delete('trash/delete/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({
    summary: 'Xoá người dùng (Chỉ Admin có quyền)',
  })
  hardRemove(@Param('id') id: string) {
    return this.usersService.hardRemove(id);
  }

  @Delete('trash/delete-multi')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.DELETE_MULTI_SUCCESS)
  @ApiOperation({
    summary: 'Xoá nhiều người dùng (Chỉ Admin có quyền)',
  })
  hardRemoveMulti(@Body() dto: RestoreAndDeleteMultiDto) {
    return this.usersService.hardRemoveMulti(dto.ids);
  }

  @Patch('restore/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.RESTORE_SUCCESS)
  @ApiOperation({
    summary: 'Khôi phục người dùng đã xoá (Chỉ Admin có quyền)',
  })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Patch('restore-multi')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(USERS_MESSAGES.RESTORE_MULTI_SUCCESS)
  @ApiOperation({
    summary: 'Khôi phục nhiều người dùng đã xoá (Chỉ Admin có quyền)',
  })
  restoreMulti(@Body() dto: RestoreAndDeleteMultiDto) {
    return this.usersService.restoreMulti(dto.ids);
  }

  @Get('export')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Xuất excel danh sách người dùng (Chỉ Admin có quyền)',
  })
  async exportUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() qs: any,
    @Req() req,
    @Res() res: Response,
  ) {
    const currentUserId = req.user._id;

    const buffer = await this.usersService.exportUsers(
      +page,
      +limit,
      qs,
      currentUserId,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=users_page_${page}.xlsx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }

  @Post('import')
  @Roles(RoleType.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import danh sách người dùng (Chỉ Admin có quyền)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    return await this.usersService.importUsers(file);
  }

  @Get('template')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Mẫu excel danh sách người dùng (Chỉ Admin có quyền)',
  })
  async getTemplate(@Res() res: Response) {
    const buffer = await this.usersService.exportTemplate();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=import_template.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
