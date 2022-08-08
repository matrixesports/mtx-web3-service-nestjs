import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('check/:creatorId')
  async check(@Param('creatorId') creatorId: number) {
    //check if creatorId exists and return address if it does
    return {
      exists: true,
      address: '0x1234567890123456789012345678901234567890',
    };
  }

  @Get('seasonId/:creatorId')
  async seasonId(@Param('creatorId') creatorId: number) {
    //check if creatorId exists and return address if it does
    return {
      seasonId: 1,
    };
  }

  @Post('deploy')
  async deploy(@Body('creatorId') creatorId: number) {
    return {
      success: true,
    };
  }

  @Post('giveXp')
  async giveXp(
    @Body('creatorId') creatorId: number,
    @Body('userAddress') userAddress: string,
    @Body('xp') xp: number,
  ) {
    return {
      success: true,
    };
  }

  @Post('newLootbox')
  async newLootbox(
    @Body('creatorId') creatorId: number,
    @Body('bundleInfo') ids: any,
  ) {
    return {
      success: true,
      lootboxId: 1001,
    };
  }

  @Post('newSeason')
  async newSeason(
    @Body('creatorId') creatorId: number,
    @Body('levelInfo') levelInfo: any,
  ) {
    return {
      success: true,
    };
  }
}
