import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FramesService } from './frames.service';
import { CreateFrameDto } from './dto/create-frame.dto';
import { UpdateFrameDto } from './dto/update-frame.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { RoleType } from '../configs/enums/user.enum';
import { ResponseMessage } from '../decorator/customize';
import { FRAMES_MESSAGES } from '../configs/messages/frame.message';
import { RestoreAndDeleteMultiDto } from '../users/dto/restore-and-delete-multi.dto';

@ApiTags('frame')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('frame')
export class FramesController {
  constructor(private readonly framesService: FramesService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(FRAMES_MESSAGES.CREATE_SUCCESS)
  @ApiOperation({
    summary: 'Tạo mới khung avatar (Chỉ Admin có quyền)',
  })
  create(@Body() createFrameDto: CreateFrameDto) {
    return this.framesService.create(createFrameDto);
  }

  @Get()
  @Roles(RoleType.ADMIN)
  @ResponseMessage(FRAMES_MESSAGES.GET_ALL_SUCCESS)
  @ApiOperation({
    summary: 'Danh sách khung avatar (Chỉ Admin có quyền)',
    description: `
Hỗ trợ filter động trực tiếp qua query string(name, createdAt, updatedAt).

Ví dụ:
- /frame?name=khungthocon
- /frame?sort=-name
- /frame?name=/khungthocon/i
- /frame?createdAt=2026-01-25T11:30:41.401Z&createdAt<=2026-02-15T14:50:27.251Z
- /frame?name=khungthocon&sort=name
`,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: `
Sắp xếp kết quả:
- createdAt (tăng dần)
- -createdAt (giảm dần)
`,
  })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() qs: string,
  ) {
    return this.framesService.findAll(+page, +limit, qs);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(FRAMES_MESSAGES.UPDATE_SUCCESS)
  @ApiOperation({
    summary: 'Cập nhật thông tin khung avatar (Chỉ Admin có quyền)',
  })
  update(@Param('id') id: string, @Body() updateFrameDto: UpdateFrameDto) {
    return this.framesService.update(id, updateFrameDto);
  }

  @Delete('delete/:id')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(FRAMES_MESSAGES.DELETE_SUCCESS)
  @ApiOperation({
    summary: 'Xoá khung avatar (Chỉ Admin có quyền)',
  })
  remove(@Param('id') id: string) {
    return this.framesService.remove(id);
  }

  @Delete('delete-multi')
  @Roles(RoleType.ADMIN)
  @ResponseMessage(FRAMES_MESSAGES.DELETE_MULTI_SUCCESS)
  @ApiOperation({
    summary: 'Xoá nhiều khung avatar (Chỉ Admin có quyền)',
  })
  removeMulti(@Body() dto: RestoreAndDeleteMultiDto) {
    return this.framesService.removeMulti(dto.ids);
  }
}
