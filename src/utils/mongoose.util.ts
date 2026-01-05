// ** NestJs
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ** Mongoose
import mongoose from 'mongoose';

// ** Messages
import { USERS_MESSAGES } from '../configs/messages/user.message';

export const validateMongoId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundException(USERS_MESSAGES.INVALID_ID);
  }
};

export const validateMongoIds = (ids: string[]) => {
  if (!ids || ids.length === 0) {
    throw new BadRequestException(USERS_MESSAGES.INVALID_IDS);
  }

  const invalid = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid.length > 0) {
    throw new BadRequestException(USERS_MESSAGES.INVALID_IDS);
  }
};
