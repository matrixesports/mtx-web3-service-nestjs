import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PlayerCubitBalanceIncrement, PlayerLevelInfo } from './manacube.dto';
import { ManacubeService } from './manacube.service';

@Controller('manacube')
export class ManacubeController {
  constructor(private manacubeService: ManacubeService) {}

  @Get('/cubit/balance')
  async getCubitsBalance(@Query('playerId') playerId: string) {
    return await this.manacubeService.getPlayerCubitBalance(playerId);
  }

  @Post('/cubit/balance/increment')
  async incrementPlayerCubits(@Body() cubitsIncrement: PlayerCubitBalanceIncrement) {
    const { uuid, value } = cubitsIncrement;
    return await this.manacubeService.incrementPlayerCubits(uuid, value);
  }

  @Get('/player/level')
  async getPlayerLevel(@Query('playerId') playerId: string) {
    return await this.manacubeService.getPlayerLevel(playerId);
  }

  @Post('/player/level/increment')
  async incrementPlayerLevel(@Body() playerInfo: PlayerLevelInfo) {
    const { uuid, progression, stat } = playerInfo;
    return await this.manacubeService.incrementPlayerLevel(uuid, stat, progression);
  }

  @Get('/patron/players')
  async getPatronPlayers() {
    return await this.manacubeService.getPatronMembers();
  }
}
