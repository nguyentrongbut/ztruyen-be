// ** Swagger
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ** Validation
import { IsBoolean, IsOptional } from 'class-validator';

// ** DTOs
import { CreateAnnouncementDto } from './create-announcement.dto';

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {
  @ApiPropertyOptional({ example: false, description: 'Bật/tắt thông báo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}