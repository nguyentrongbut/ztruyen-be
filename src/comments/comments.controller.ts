// ** Nestjs
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query
} from '@nestjs/common'

// ** Swagger
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger'

// ** Service
import { CommentsService } from './comments.service'

// ** DTO
import { CreateCommentDto } from './dto/create-comment.dto'
import { LikeCommentDto } from './dto/like-comment.dto'
import { ReportCommentDto } from './dto/report-comment.dto'

// ** Interface
import { IUser } from '../users/users.interface'

// ** Decorator
import { ResponseMessage, User } from '../decorator/customize'

@ApiTags('comment')
@ApiBearerAuth('access-token')
@Controller('comment')
export class CommentsController {

  constructor(
    private readonly commentsService: CommentsService
  ) {}

  @Post()
  @ResponseMessage('Tạo bình luận thành công')
  @ApiOperation({ summary: 'Tạo comment hoặc reply' })
  create(
    @Body() dto: CreateCommentDto,
    @User() user: IUser
  ){
    return this.commentsService.create(user._id, dto)
  }

  @Post('like')
  @ResponseMessage('Like comment thành công')
  like(
    @Body() dto: LikeCommentDto,
    @User() user: IUser
  ){
    return this.commentsService.like(user._id, dto.commentId)
  }

  @Post('report')
  @ResponseMessage('Report comment thành công')
  report(
    @Body() dto: ReportCommentDto,
    @User() user: IUser
  ){
    return this.commentsService.report(user._id, dto)
  }

  @Get()
  @ResponseMessage('Lấy danh sách comment')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getComments(
    @Query('page') page:number,
    @Query('limit') limit:number,
    @Query() qs:string
  ){
    return this.commentsService.getComments(+page,+limit,qs)
  }

  @Get('replies/:id')
  @ResponseMessage('Lấy danh sách replies')
  getReplies(@Param('id') id:string){
    return this.commentsService.getReplies(id)
  }
}