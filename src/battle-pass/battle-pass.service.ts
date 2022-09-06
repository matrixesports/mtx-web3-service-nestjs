import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'postgres-array';
import { BattlePassDB } from './battle-pass.entity';
import axios from 'axios';
import { MetadataDB } from 'src/metadata/metadata.entity';

@Injectable()
export class BattlePassService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>,
  ) {}

  async getBattlePassDB(creatorId: number): Promise<BattlePassDB> {
    return await this.battlePassRepository.findOneByOrFail({
      creator_id: creatorId,
    });
  }

  /**
   * use rollback when updating shit
   */
  async addBattlePassDB(creatorId: number) {
    await this.battlePassRepository.insert({
      creator_id: creatorId,
      name: 'TODO',
      description: 'TODO',
      price: 'TODO',
      currency: 'TODO',
      end_date: new Date().toISOString(),
      required_user_payment_options: null,
      required_user_social_options: null,
    });
  }

  async findAll(): Promise<BattlePassDB[]> {
    return await this.battlePassRepository.find();
  }

  /**
   * check what contact info is needed for a season
   * only called for level 1
   * @param creatorId
   * @param userAddress
   * @param level
   */
  async checkRequiredFields(
    creatorId: number,
    userAddress: string,
    level: number,
  ): Promise<RequiredFieldsResponse> {
    if (level != 1) return null;
    const logger = new Logger(this.checkRequiredFields.name);
    const logData = { external: {} };
    const battlePassDB = await this.getBattlePassDB(creatorId);
    if (
      battlePassDB.required_user_social_options.length == 0 &&
      battlePassDB.required_user_payment_options.length == 0
    )
      return;
    //convert string to array
    const required_user_social_options = parse(
      battlePassDB.required_user_social_options,
      (value) => value,
    );
    const required_user_payment_options = parse(
      battlePassDB.required_user_payment_options,
      (value) => value,
    );

    const requiredFieldsBody: RequiredFieldsBody = {
      userAddress,
      required_user_social_options,
      required_user_payment_options,
    };
    const start = Date.now();
    const missingRedeemFields = await axios.post(
      `${
        this.configService.get('SERVICE').userService
      }/api/user/missingRedeemFields`,
      requiredFieldsBody,
    );
    logData.external['0'] = {
      path: '/api/user/missingRedeemFields',
      body: requiredFieldsBody,
      responseTime: Date.now() - start,
    };
    logger.log(logData);
    if (
      missingRedeemFields.data.missing_user_payment_options.length != 0 ||
      missingRedeemFields.data.missing_user_social_options.length != 0
    ) {
      return {
        missing_user_payment_options:
          missingRedeemFields.data.missing_user_payment_options,
        missing_user_social_options:
          missingRedeemFields.data.missing_user_social_options,
      };
    }
    return null;
  }

  /**
   * helper when item is redeemed
   * @param itemId
   * @param userAddress
   * @param creatorId
   * @param address
   * @param metadata
   */
  async redeemItemHelper(
    itemId: number,
    userAddress: string,
    creatorId: number,
    address: string,
    metadata: MetadataDB,
  ) {
    const logger = new Logger(this.redeemItemHelper.name);
    const logData = { external: {} };
    const ticketRedeemBody: TicketRedeemBody = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    let start = Date.now();
    await axios.post(
      `${
        this.configService.get('SERVICE').ticketService
      }/api/ticket/redemption`,
      ticketRedeemBody,
    );
    logData.external['0'] = {
      path: '/api/ticket/redemption',
      body: ticketRedeemBody,
      responseTime: Date.now() - start,
    };
    const twitchRedeemBody: TwitchRedeemBody = {
      ...metadata,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    start = Date.now();
    await axios.post(
      `${
        this.configService.get('SERVICE').twitchService
      }/redemptions/redemption`,
      twitchRedeemBody,
    );
    logData.external['1'] = {
      path: '/redemptions/redemption',
      body: twitchRedeemBody,
      responseTime: Date.now() - start,
    };
    logger.log(logData);
  }
}

interface TicketRedeemBody {
  name: string;
  description: string;
  image: string;
  creatorId: number;
  itemId: number;
  userAddress: string;
  itemAddress: string;
}

interface TwitchRedeemBody {
  name: string;
  description: string;
  image: string;
  creatorId: number;
  itemId: number;
  userAddress: string;
  itemAddress: string;
}

interface RequiredFieldsBody {
  userAddress: string;
  required_user_social_options: string[];
  required_user_payment_options: string[];
}

interface RequiredFieldsResponse {
  missing_user_social_options: string[];
  missing_user_payment_options: string[];
}
