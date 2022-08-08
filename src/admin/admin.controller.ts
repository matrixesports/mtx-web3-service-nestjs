import { Controller, Get, Param } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('check/:creatorId')
  async check(@Param('creatorId') creatorId: number) {}
}
