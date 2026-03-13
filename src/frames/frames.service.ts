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
import { validateMongoId, validateMongoIds } from '../utils/mongoose.util';
import { IFrame } from './frames.interface';
import { Types } from 'mongoose';
import { ImagesService } from '../images/images.service';

@Injectable()
export class FramesService {
  constructor(
    @InjectModel(Frame.name) private frameModel: SoftDeleteModel<FrameDocument>,
    private readonly imageService: ImagesService,
  ) {}

  // CRUD
  async create(createFrameDto: CreateFrameDto) {
    const { name } = createFrameDto;

    // check name exists
    if (await this.frameModel.findOne({ name })) {
      throw new BadRequestException(FRAMES_MESSAGES.NAME_EXISTED);
    }

    const newFrame = await this.frameModel.create(createFrameDto);

    return {
      _id: newFrame?._id,
      createdAt: newFrame?.createdAt,
    };
  }

  async findAll(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    filter.isDeleted = false;

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.frameModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.frameModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate([
        { path: 'image', select: 'url' }
      ])
      .select('-isDeleted -deletedAt')
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
    return this.frameModel
      .findOne({
        _id: id,
      })
      .populate([
        { path: 'image', select: 'url' }
      ])
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

    if (
      updateFrameDto.image &&
      updateFrameDto.image !== currentFrame.image?.toString()
    ) {
      updateData.image = new Types.ObjectId(updateFrameDto.image);
    }

    if (updateFrameDto.name !== undefined) {
      updateData.name = updateFrameDto.name;
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

    const frame = await this.frameModel
      .findById(id)
      .select('image')
      .lean();

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
