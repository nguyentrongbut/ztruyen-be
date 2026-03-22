import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { CommentsService } from './comments.service';

import { Roles } from '../decorator/roles.decorator';

import { User, ResponseMessage, Public } from '../decorator/customize';
import { RoleType } from '../configs/enums/user.enum';
import { CreateCommentDto } from './dto/create-comment.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';
import { COMMENT_MESSAGES } from '../configs/messages/comment.message';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { IUser } from '../users/users.interface';
import { CreateReplyDto } from './dto/create-reply.dto';

@ApiTags('comment')
@ApiBearerAuth('access-token')
@Controller('comment')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Public()
  @Get()
  @ResponseMessage(COMMENT_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({
    summary: 'Lấy danh sách bình luận theo comicSlug / chapterId',
    description: `
Hỗ trợ filter + search + sort động

Ví dụ:
- /comments?comicSlug=one-piece
- /comments?comicSlug=one-piece&chapterId=chap-1
- /comments?search=luffy
- /comments?sort=-likeCount
- /comments?createdAt>=2026-01-01
`,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({
    name: 'comicSlug',
    required: false,
  })
  @ApiQuery({
    name: 'chapterId',
    required: false,
  })
  getComments(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('userId') userId: string,
    @Query() qs: string,
  ) {
    return this.service.getComments(+page, +limit, qs, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bình luận' })
  @ResponseMessage(COMMENT_MESSAGES.CREATE_SUCCESS)
  create(@Body() dto: CreateCommentDto, @User() user: IUser) {
    return this.service.create(dto, user._id);
  }

  @Post('reply')
  @ApiOperation({ summary: 'Tạo phản hồi' })
  @ResponseMessage(COMMENT_MESSAGES.CREATE_SUCCESS)
  createReply(@Body() dto: CreateReplyDto, @User() user: IUser) {
    return this.service.createReply(dto, user._id);
  }

  @Post('like')
  @ApiOperation({ summary: 'Thích / bỏ thích bình luận' })
  @ResponseMessage(COMMENT_MESSAGES.LIKE_SUCCESS)
  like(@Body() dto: LikeCommentDto, @User() user: IUser) {
    return this.service.like(dto.commentId, user._id);
  }

  @Post('report')
  @ApiOperation({ summary: 'Báo cáo bình luận' })
  @ResponseMessage(COMMENT_MESSAGES.REPORT_SUCCESS)
  report(@Body() dto: ReportCommentDto, @User('id') @User() user: IUser) {
    return this.service.report(dto.commentId, user._id, dto.reason);
  }

  @Public()
  @Get('replies/:id')
  @ApiOperation({ summary: 'Lấy danh sách phản hồi của bình luận' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'userId', required: false })
  @ResponseMessage(COMMENT_MESSAGES.GET_REPLIES_SUCCESS)
  getReplies(
    @Param('id') parentId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('userId') userId: string,
    @Query() qs: string,
  ) {
    return this.service.getReplies(parentId, page, limit, qs, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ResponseMessage(COMMENT_MESSAGES.DELETE_SUCCESS)
  delete(@Param('id') id: string, @User() user: IUser) {
    return this.service.delete(id, user._id);
  }

  /* ================= ADMIN ================= */

  @Get('admin/all')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Admin lấy tất cả bình luận' })
  @ResponseMessage(COMMENT_MESSAGES.ADMIN_GET_ALL_SUCCESS)
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'comicName', required: false })
  @ApiQuery({ name: 'comicSlug', required: false })
  @ApiQuery({ name: 'chapterId', required: false })
  @ApiQuery({ name: 'sort', required: false })
  adminGetAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.service.adminGetComments(+page, +limit, qs);
  }

  @Delete('admin/hard/:id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Admin xóa comment' })
  @ResponseMessage(COMMENT_MESSAGES.ADMIN_DELETE_SUCCESS)
  adminHardDelete(@Param('id') id: string) {
    return this.service.adminHardDelete(id);
  }

  @Get('admin/reports')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Danh sách report comment' })
  @ResponseMessage(COMMENT_MESSAGES.ADMIN_GET_REPORTS_SUCCESS)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'resolved', 'rejected'],
  })
  adminGetReports(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.service.adminGetReports(+page, +limit, qs);
  }

  @Patch('admin/reports/:id/resolve')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Xử lý report' })
  @ResponseMessage(COMMENT_MESSAGES.ADMIN_RESOLVE_REPORT_SUCCESS)
  adminResolveReport(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.service.adminResolveReport(id, dto.status);
  }
}
