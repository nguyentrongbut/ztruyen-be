import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';
import { USERS_MESSAGES } from '../configs/messages/user.message';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Frame, FrameDocument } from './schemas/frame.schemas';
import { FRAMES_MESSAGES } from '../configs/messages/frame.message';
import aqp from 'api-query-params';


@Injectable()
export class FramesService {
  constructor(
    @InjectModel(Frame.name) private frameModel: SoftDeleteModel<FrameDocument>,
  ) {}

  // CRUD
  async create(createFrameDto: CreateFrameDto) {
    const { name } = createFrameDto;

    // check name exists
    if (await this.frameModel.findOne({ name })) {
      throw new BadRequestException(FRAMES_MESSAGES.NAME_EXISTED);
    }

    const newFrame = await this.frameModel.create({createFrameDto});

    return {
      _id: newFrame?._id,
      createdAt: newFrame?.createdAt,
    };
  }

  async findAll(
    page: number,
    limit: number,
    qs: string,
  ) {
    const { filter, sort, population } = aqp(qs);
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
      .populate(population)
      .select('-isDeleted')
      .exec();

    return {
      meta: {
        page,
        limit,
        totalPages,
        totalItems,
      },
      result,
    }
  }

  update(id: number, updateFrameDto: UpdateFrameDto) {
    return `This action updates a #${id} frame`;
  }

  remove(id: number) {
    return `This action removes a #${id} frame`;
  }
}
