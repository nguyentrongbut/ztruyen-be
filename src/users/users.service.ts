// ** NestJs
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// ** Api Query Params
import aqp from 'api-query-params';

// ** DTO
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserSocialDto } from './dto/create-user-social.dto';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImportUserDto } from './dto/import-user.dto';

// ** Schemas
import { User, UserDocument } from './schemas/user.schema';

// ** Soft Delete Plugin
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';

// ** Bcryptjs
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';

// ** Crypto
import { randomBytes } from 'crypto';

// ** ms
import ms from 'ms';

// ** Interface
import { IUser } from './users.interface';

// ** Message
import { USERS_MESSAGES } from '../configs/messages/user.message';

// ** utils
import { validateMongoId, validateMongoIds } from '../utils/mongoose.util';

// ** exceljs
import ExcelJS from 'exceljs';

// ** Enums
import { ProviderType, RoleType } from '../configs/enums/user.enum';

// ** Dayjs
import dayjs from 'dayjs';

@Injectable()
export class UsersService {
  private readonly emailExpire: string;

  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    this.emailExpire = this.configService.get<string>(
      'EMAIL_RESET_PASSWORD_EXPIRE',
    );
  }

  async ensureNotDeleted(_id: string) {
    validateMongoId(_id);
    const user = await this.userModel.findById(_id).select('isDeleted').lean();
    if (!user || user.isDeleted) {
      throw new BadRequestException(USERS_MESSAGES.DELETED_OR_BANNED);
    }
  }

  // Auth
  findOneByEmail(email: string) {
    return this.userModel.findOne({
      email,
    });
  }

  findUserByToken(refreshToken: string) {
    return this.userModel.findOne({ refreshToken });
  }

  async register(user: RegisterUserDto) {
    const { email, password } = user;

    // check email exists
    if (await this.userModel.findOne({ email })) {
      throw new BadRequestException(USERS_MESSAGES.EMAIL_EXISTED);
    }

    const hash = this.getHashPassword(password);
    return this.userModel.create({ ...user, password: hash });
  }

  // forgot password
  async setResetToken(email: string) {
    const user = await this.findOneByEmail(email);
    if (!user) throw new BadRequestException(USERS_MESSAGES.USER_NOT_FOUND);

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(
      Date.now() +
      ms(this.configService.get<string>('EMAIL_RESET_PASSWORD_EXPIRE')),
    );
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();
    return token;
  }

  async verifyResetToken(token: string) {
    const user = await this.userModel.findOne({ resetToken: token });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException(USERS_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
    return user;
  }

  async updatePassword(userId: string, password: string) {
    const hashed = this.getHashPassword(password);
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          password: hashed,
          resetToken: null,
          resetTokenExpiry: null,
        },
      },
      { new: true },
    );
  }

  async createUserSocial(createUserSocialDto: CreateUserSocialDto) {
    return this.userModel.create(createUserSocialDto);
  }

  // Profile
  async findProfile(user: IUser) {
    await this.ensureNotDeleted(user._id);
    return this.userModel
      .findById(user._id)
      .select('-password -refreshToken -isDeleted -deletedAt');
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, user: IUser) {
    await this.ensureNotDeleted(user._id);
    return this.userModel.updateOne({ _id: user._id }, { $set: updateProfileDto });
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  updateUserToken(refreshToken: string, _id: string) {
    return this.userModel.updateOne({ _id }, { $set: { refreshToken } });
  }

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    return hashSync(password, salt);
  };

  // End Auth

  // CRUD
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    // check email exists
    if (await this.userModel.findOne({ email })) {
      throw new BadRequestException(USERS_MESSAGES.EMAIL_EXISTED);
    }

    const hashPassword = this.getHashPassword(password);

    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashPassword,
    });

    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt,
    };
  }

  async findAll(
    page: number,
    limit: number,
    qs: string,
    currentUserId: string,
  ) {
    const { filter, sort, population } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    filter.isDeleted = false;

    filter._id = { $ne: currentUserId };

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select('-password -refreshToken -isDeleted')
      .exec();

    return {
      meta: {
        page,
        limit,
        totalPages,
        totalItems,
      },
      result,
    };
  }

  async findOne(id: string) {
    await this.ensureNotDeleted(id);

    return this.userModel
      .findOne({
        _id: id,
      })
      .select('-password -refreshToken -isDeleted');
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.ensureNotDeleted(id);
    return this.userModel.updateOne({ _id: id }, { $set: updateUserDto });
  }

  async remove(id: string) {
    await this.ensureNotDeleted(id);
    return this.userModel.softDelete({ _id: id });
  }

  async removeMulti(ids: string[]) {
    validateMongoIds(ids);
    const users = await this.userModel.find({
      _id: { $in: ids },
      isDeleted: { $ne: true },
    });
    if (!users.length)
      throw new BadRequestException(USERS_MESSAGES.NO_ELIGIBLE);
    return this.userModel.softDelete({ _id: { $in: users.map((u) => u._id) } });
  }

  // End CRUD

  // Trash
  async findDeleted(page: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    filter.isDeleted = true;

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select('-password -refreshToken -isDeleted')
      .exec();

    return {
      meta: {
        page,
        limit,
        totalPages,
        totalItems,
      },
      result,
    };
  }

  async findOneDeleted(id: string) {
    validateMongoId(id);
    return this.userModel
      .findById(id)
      .select('-password -refreshToken -isDeleted');
  }

  async hardRemove(id: string) {
    validateMongoId(id);
    return this.userModel.deleteOne({ _id: id });
  }

  async hardRemoveMulti(ids: string[]) {
    validateMongoIds(ids);
    const users = await this.userModel.find({
      _id: { $in: ids },
      isDeleted: true,
    });
    if (!users.length)
      throw new BadRequestException(USERS_MESSAGES.NO_ELIGIBLE);
    return this.userModel.deleteMany({ _id: { $in: users.map((u) => u._id) } });
  }

  async restore(id: string) {
    validateMongoId(id);
    return this.userModel.restore({ _id: id });
  }

  async restoreMulti(ids: string[]) {
    validateMongoIds(ids);
    return this.userModel.restore({ _id: { $in: ids } });
  }

  // End Trash

  // export
  async exportUsers(
    page: number,
    limit: number,
    qs: string,
    currentUserId: string,
  ): Promise<Buffer> {
    const { filter, sort, population } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    filter.isDeleted = false;

    filter._id = { $ne: currentUserId };

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const users = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(+limit)
      .sort(sort as any)
      .select('-password -refreshToken')
      .populate(population)
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Users Page ${page}`);

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Birthday', key: 'birthday', width: 30 },
      { header: 'Avatar', key: 'avatar', width: 30 },
      { header: 'Avatar Frame', key: 'avatar_frame', width: 30 },
      { header: 'Cover', key: 'cover', width: 30 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Bio', key: 'bio', width: 25 },
      { header: 'Provider', key: 'provider', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 30 },
      { header: 'Updated At', key: 'updatedAt', width: 30 },
    ];

    users.forEach((user) => {
      sheet.addRow({
        name: user.name,
        email: user.email,
        age: user.age,
        birthday: user.birthday
          ? dayjs(user.birthday).format('DD/MM/YYYY')
          : '',
        avatar: user.avatar || '',
        avatar_frame: user.avatar_frame || '',
        cover: user.cover || '',
        gender: user.gender,
        role: user.role,
        bio: user.bio,
        provider: user.provider,
        createdAt: new Date(user.createdAt).toLocaleString(),
        updatedAt: new Date(user.updatedAt).toLocaleString(),
      });
    });

    sheet.addRow([]);
    sheet.addRow([`Page ${page}/${totalPages}`]);
    sheet.addRow([`Total: ${totalItems} users`]);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // import
  async importUsers(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const sheet = workbook.worksheets[0];
    const imported: ImportUserDto[] = [];

    const cleanValue = (val: any): any => {
      if (typeof val === 'object' && val?.text) return val.text;
      return val ?? null;
    };

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const values = row.values as any[];

      try {
        const [
          name,
          email,
          age,
          birthday,
          avatar,
          avatar_frame,
          cover,
          gender,
          role,
          bio,
          provider,
          password,
        ] = values.slice(1).map(cleanValue);

        if (!email) return;

        imported.push({
          name: name as string,
          email: email as string,
          age: Number(age) || 0,
          birthday: birthday ? dayjs(birthday, 'DD/MM/YYYY').toDate() : null,
          avatar: avatar as string,
          avatar_frame: avatar_frame as string,
          cover: cover as string,
          gender: gender as string,
          role: role as RoleType,
          bio: bio as string,
          provider: provider as ProviderType,
          password: password as string,
        });
      } catch (err) {
        console.error(`Lỗi ở dòng ${rowNumber}:`, err);
      }
    });

    for (const u of imported) {
      const exists = await this.userModel.findOne({ email: u.email });
      if (exists) {
        throw new BadRequestException(`Email ${u.email} đã tồn tại`);
      }
    }

    await this.userModel.insertMany(imported);

    return { message: `Nhập ${imported.length} người dùng thành công` };
  }

  // export template
  async exportTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Import Template');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Birthday', key: 'birthday', width: 15 },
      { header: 'Avatar', key: 'avatar', width: 30 },
      { header: 'Avatar Frame', key: 'avatar_frame', width: 30 },
      { header: 'Cover', key: 'cover', width: 30 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Bio', key: 'bio', width: 25 },
      { header: 'Provider', key: 'provider', width: 25 },
    ];

    sheet.addRow([
      'John Doe',
      'john@example.com',
      25,
      dayjs('2000-01-01').format('DD/MM/YYYY'),
      'https://example.com/avatar.webp',
      'https://example.com/avatarframe.webp',
      'https://example.com/cover.webp',
      'male',
      'user',
      'New member',
      'local',
    ]);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
