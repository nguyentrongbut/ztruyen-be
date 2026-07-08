// ** Class Validator
import { IsOptional, IsDateString } from 'class-validator';

// ** Swagger
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OverviewQueryDto {
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
