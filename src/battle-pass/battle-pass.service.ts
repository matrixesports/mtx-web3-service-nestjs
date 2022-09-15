import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BigNumber } from 'ethers';
import { Reward } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { DataSource, Repository } from 'typeorm';
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
    private metadataService: MetadataService,
    private dataSource: DataSource,
  ) {}

  /*
|========================| REPOSITORY |========================|
*/

  async getBattlePass(creatorId: number) {
    const bp = await this.battlePassRepository
      .createQueryBuilder('bp')
      .select()
      .where('bp.creator_id = :creatorId', { creatorId })
      .getOne();
    if (bp) return bp;
    throw new Error('BattlePass Not Found!');
  }

  async getBattlePasses() {
    const bp = await this.battlePassRepository
      .createQueryBuilder()
      .select()
      .getMany();
    if (bp) return bp;
    throw new Error('BattlePasses Not Found!');
  }

  async addBattlePass(creatorId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let bp;
    try {
      bp = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(BattlePassDB)
        .values({
          creator_id: creatorId,
          name: 'TODO',
          description: 'TODO',
          price: 'TODO',
          currency: 'TODO',
          end_date: new Date().toISOString(),
          required_user_payment_options: null,
          required_user_social_options: null,
        })
        .execute();
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      bp = null;
    } finally {
      await queryRunner.release();
    }
    if (bp) return bp;
    throw new Error('Insert Recipe Failed!');
  }

  /*
|========================| SERVICE CALLS |========================|
*/

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
    const battlePassDB = await this.getBattlePass(creatorId);
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
    const missingRedeemFields = await axios.post(
      `${
        this.configService.get('SERVICE').userService
      }/api/user/missingRedeemFields`,
      requiredFieldsBody,
    );
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
    const ticketRedeemBody: TicketRedeemBody = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    await axios.post(
      `${
        this.configService.get('SERVICE').ticketService
      }/api/ticket/redemption`,
      ticketRedeemBody,
    );
    const twitchRedeemBody: TwitchRedeemBody = {
      ...metadata,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    try {
      await axios.post(
        `${
          this.configService.get('SERVICE').twitchService
        }/redemptions/redemption`,
        twitchRedeemBody,
      );
    } catch (e) {
      console.log('Twitch Service Failed');
    }
  }

  /*
|========================| OPERATIONS |========================|
*/

  async createRewardObj(
    creatorId: number,
    id: BigNumber,
    qty: BigNumber,
  ): Promise<Reward> {
    if (!id || id.isZero()) return null;
    const metadata = await this.metadataService.getMetadata(
      creatorId,
      id.toNumber(),
    );
    return {
      id,
      qty,
      metadata,
      rewardType: metadata.reward_type,
      creatorId,
    };
  }
}

/*
|========================| DEFINITIONS |========================|
*/

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
