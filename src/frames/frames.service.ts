// ** Nestjs
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// ** Dtos
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';

// ** Soft Delete
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';

// ** Schemas
import { Frame, FrameDocument } from './schemas/frame.schemas';

// ** Config
import { FRAMES_MESSAGES } from '../configs/messages/frame.message';

// ** api query params
import aqp from 'api-query-params';

// ** Frame
import { IFrame } from './frames.interface';

// ** Type
import { Types } from 'mongoose';

// ** Service
import { ImagesService } from '../images/images.service';

// ** Util
import { removeVietnameseTones } from '../utils/removeVietnameseTones';
import { validateMongoId, validateMongoIds } from '../utils/mongoose.util';

@Injectable()
export class FramesService {
  constructor(
    @InjectModel(Frame.name) private frameModel: SoftDeleteModel<FrameDocument>,
    private readonly imageService: ImagesService,
  ) {}

  // CRUD
  async create(createFrameDto: CreateFrameDto) {
    const name = createFrameDto.name.trim();

    if (await this.frameModel.findOne({
      name: { $regex: `^${name}$`, $options: 'i' }
    })) {
      throw new BadRequestException(FRAMES_MESSAGES.NAME_EXISTED);
    }

    const newFrame = await this.frameModel.create({
      ...createFrameDto,
      name,
      image: createFrameDto.image ? new Types.ObjectId(createFrameDto.image) : undefined,
      name_unsigned: removeVietnameseTones(name),
    });

    return {
      _id: newFrame._id,
      createdAt: newFrame.createdAt,
    };
  }

  async findAll(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    filter.isDeleted = false;

    const keyword = filter.search;

    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);

      const regex = unsigned.trim().split(/\s+/).join('.*');

      filter.name_unsigned = {
        $regex: regex,
        $options: 'i',
      };

      delete filter.search;
    }

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.frameModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.frameModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate([{ path: 'image', select: 'url' }])
      .select('-isDeleted -deletedAt')
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

  async findOne(id: string) {
    return this.frameModel
      .findOne({
        _id: id,
      })
      .populate([{ path: 'image', select: 'url' }])
      .select('-isDeleted -deletedAt');
  }

  async update(id: string, updateFrameDto: UpdateFrameDto) {
    validateMongoId(id);

    const currentFrame = await this.frameModel
      .findById(id)
      .select('image')
      .lean();

    if (!currentFrame) {
      throw new NotFoundException(FRAMES_MESSAGES.INVALID_ID);
    }

    const updateData: Partial<IFrame> = {};

    if (updateFrameDto.name !== undefined) {
      const name = updateFrameDto.name.trim();

      const existed = await this.frameModel.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existed) throw new BadRequestException(FRAMES_MESSAGES.NAME_EXISTED);

      updateData.name = name;
      updateData.name_unsigned = removeVietnameseTones(name);
    }

    if (
      updateFrameDto.image &&
      updateFrameDto.image !== currentFrame.image?.toString()
    ) {
      updateData.image = new Types.ObjectId(updateFrameDto.image);
    }

    const result = await this.frameModel.updateOne(
      { _id: id },
      { $set: updateData },
    );

    // remove old images AFTER update
    if (updateData.image && currentFrame.image) {
      await this.imageService.remove(currentFrame.image.toString());
    }

    return result;
  }

  async remove(id: string) {
    validateMongoId(id);

    const frame = await this.frameModel.findById(id).select('image').lean();

    if (!frame) {
      throw new NotFoundException(FRAMES_MESSAGES.INVALID_ID);
    }

    await this.frameModel.deleteOne({ _id: id });

    if (frame.image) {
      await this.imageService.remove(frame.image.toString());
    }

    return { deleted: true };
  }

  async removeMulti(ids: string[]) {
    validateMongoIds(ids);

    const frames = await this.frameModel
      .find({ _id: { $in: ids } })
      .select('image')
      .lean();

    if (!frames.length) {
      throw new BadRequestException(FRAMES_MESSAGES.NO_ELIGIBLE);
    }

    await this.frameModel.deleteMany({
      _id: { $in: frames.map((f) => f._id) },
    });

    const imageIds = frames
      .filter((f) => f.image)
      .map((f) => f.image.toString());

    if (imageIds.length) {
      await this.imageService.removeMany(imageIds);
    }

    return {
      deletedCount: frames.length,
    };
  }
}
