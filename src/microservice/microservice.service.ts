/* eslint-disable @typescript-eslint/no-empty-function */
import { Inject, Injectable, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BattlePassDB } from 'src/battlepass/battlepass.entity';
import {
  ClaimLootdropAlert,
  CLAIM_LOOTDROP_ALERT,
  LEADERBOARD_TOP3_ALERT,
  LevelUpAlert,
  LEVELUP_ALERT,
  MINT_PREMIUM_PASS,
  NEW_LOOTDROP_ALERT,
  NEW_SEASON_ALERT,
  RequiredFieldsBody,
  RequiredFieldsResponse,
  ShortUrl,
  TicketRedeemBody,
  TwitchRedeemBody,
} from './microservice.dto';
import { parse } from 'postgres-array';
import { MetadataDB } from 'src/inventory/inventory.entity';
import { ClientProxy } from '@nestjs/microservices';
import { LootdropReward } from 'src/reward/reward.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@Injectable()
export class MicroserviceService {
  constructor(
    private configService: ConfigService,
    @Inject('TWITCH_SERVICE') private twitchClient: ClientProxy,
    @Inject('DISCORD_SERVICE') private discordClient: ClientProxy,
  ) {}

  sendClaimLootdropAlert(creatorId: number, userAddress: string) {
    const alert: ClaimLootdropAlert = {
      userAddress,
      creatorId,
    };
    this.twitchClient.emit<ClaimLootdropAlert>(CLAIM_LOOTDROP_ALERT, alert);
  }

  sendNewLootdropAlert(alert: LootdropReward) {
    this.twitchClient.emit<LootdropReward>(NEW_LOOTDROP_ALERT, alert);
    this.discordClient.emit<LootdropReward>(NEW_LOOTDROP_ALERT, alert);
  }

  sendLevelUpAlert(
    creatorId: number,
    userAddress: string,
    oldlvl: number,
    newlvl: number,
  ) {
    const alert: LevelUpAlert = {
      creatorId,
      userAddress,
      oldlvl,
      newlvl,
    };
    this.discordClient.emit<LevelUpAlert>(LEVELUP_ALERT, alert);
  }

  async createUrl(creatorId: number) {
    const urlpayload = {
      creatorId,
    };
    const {
      data: { shortUrl },
    } = await axios.post<ShortUrl>(
      `${this.configService.get<string>('microservice.url.url')}/createurl`,
      urlpayload,
    );
    return shortUrl;
  }

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
    // return res.data;
    const res = await axios
      .get(
        `${this.configService.get<string>(
          'microservice.user.url',
        )}/api/creator/${creatorId}/followers`,
      )
      .catch((error) => {
        console.log(error);
        throw new Error('Fetching Leaderboard Failed!');
      });
    return res.data;
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
    battlePassDB: BattlePassDB,
  ): Promise<RequiredFieldsResponse> {
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
      `${this.configService.get<string>(
        'microservice.user.url',
      )}/api/user/missingRedeemFields`,
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
      `${this.configService.get<string>(
        'microservice.ticket.url',
      )}/api/ticket/redemption`,
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
        `${this.configService.get<string>(
          'microservice.twitch.url',
        )}/redemptions/redemption`,
        twitchRedeemBody,
      );
    } catch (e) {
      console.log('Twitch Service Failed');
    }
  }
  /*
|========================| ABSTRACT |========================|
*
* These functions are used to generate swagger UI
*/

  @ApiOkResponse({ type: LootdropReward })
  @Post(NEW_LOOTDROP_ALERT)
  @ApiTags('TCP EVENTS')
  async mock() {}

  @ApiOkResponse({ type: LevelUpAlert })
  @Post(LEVELUP_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_1() {}

  @ApiOkResponse({ type: ClaimLootdropAlert })
  @Post(CLAIM_LOOTDROP_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_2() {}

  @ApiOkResponse({ type: LevelUpAlert })
  @Post(MINT_PREMIUM_PASS)
  @ApiTags('TCP EVENTS')
  async mock_3() {}

  @ApiOkResponse({ type: LevelUpAlert })
  @Post(LEADERBOARD_TOP3_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_4() {}

  @ApiOkResponse({ type: LevelUpAlert })
  @Post(NEW_SEASON_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_5() {}
}
