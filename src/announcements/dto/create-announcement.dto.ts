// ** Validation
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

// ** Swagger
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ** Enums
import { AnnouncementType } from '../schemas/announcement.schema';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Bảo trì hệ thống' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Hệ thống sẽ bảo trì từ 23:00 đến 01:00' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    enum: AnnouncementType,
    default: AnnouncementType.INFO,
    description: `
- info        → thông tin thường
- warning     → cảnh báo
- maintenance → bảo trì hệ thống
- event       → sự kiện
`,
  })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Thời gian bắt đầu hiển thị. Null = hiển thị ngay',
  })
  @IsDateString()
  @IsOptional()
  startAt?: Date;

  @ApiPropertyOptional({
    example: '2026-04-02T00:00:00.000Z',
    description: 'Thời gian kết thúc hiển thị. Null = hiển thị mãi',
  })
  @IsDateString()
  @IsOptional()
  endAt?: Date;
}