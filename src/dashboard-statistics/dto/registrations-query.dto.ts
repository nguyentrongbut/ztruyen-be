// ** Class Validator
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

// ** Swagger
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GroupType {
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
}

export class RegistrationsQueryDto {
  @ApiProperty({
    description: 'Kiểu gom nhóm dữ liệu (day, month, year)',
    enum: GroupType,
    example: 'day',
  })
  @IsEnum(GroupType)
  type: GroupType;

  @ApiPropertyOptional({
    description: 'Thời gian bắt đầu (ISO 8601), mặc định là 30 ngày trước',
    example: '2026-06-08T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Thời gian kết thúc (ISO 8601), mặc định là hiện tại',
    example: '2026-07-08T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
