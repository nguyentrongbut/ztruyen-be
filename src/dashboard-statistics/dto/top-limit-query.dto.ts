// ** Class Validator
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

// ** Swagger
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TopLimitQueryDto {
  @ApiPropertyOptional({
    description: 'Số lượng kết quả giới hạn, mặc định là 10, tối đa 50',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
