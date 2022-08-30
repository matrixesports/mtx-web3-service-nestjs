import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LeaderboardService {
  constructor(private configService: ConfigService) {}

  async getFollowers(creatorId: number) {
    // const res = { data: [] };
    // res.data.push({
    //   userAddress: 'E0c788889AaBeAd8D4181d14b2868E7720AE1c26',
    //   id: 10,
    //   pfp: 'pfp',
    //   name: 'name',
    // });
    // res.data.push({
    //   userAddress: '0000000000000000000000000000000000000001',
    //   id: 11,
    //   pfp: 'pfp1',
    //   name: 'name1',
    // });
    // return res;
    const logger = new Logger(this.getFollowers.name);
    const logData = { external: {} };
    const start = Date.now();
    const res = await axios.get(
      `${
        this.configService.get('SERVICE').userService
      }/creator?id=${creatorId}/followers`,
    );
    logData.external['0'] = {
      path: '/redemptions/redemption',
      responseTime: Date.now() - start,
    };
    logger.log(logData);
    return res;
  }
}
