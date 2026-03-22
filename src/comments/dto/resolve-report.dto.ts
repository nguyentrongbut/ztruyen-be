import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from '../../configs/enums/comment.enum';
import { IsEnum } from 'class-validator';

export class ResolveReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  status: ReportStatus
}