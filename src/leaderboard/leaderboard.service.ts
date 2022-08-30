import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LeaderboardService {
  constructor(private configService: ConfigService) {}

  async getFollowers(creatorId: number) {
    const logger = new Logger(this.getFollowers.name);
    const logData = { external: {} };
    const start = Date.now();
    const res = await axios.get(
      `${
        this.configService.get('SERVICE').userService
      }creator/${creatorId}/followers`,
    );
    logData.external['0'] = {
      path: '/redemptions/redemption',
      responseTime: Date.now() - start,
    };
    logger.log(logData);
    return res;
  }
}
