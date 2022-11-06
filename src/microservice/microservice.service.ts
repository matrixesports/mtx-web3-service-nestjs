/* eslint-disable @typescript-eslint/no-empty-function */
import { Controller, Inject, Injectable, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BattlePassDB } from 'src/battlepass/battlepass.entity';
import {
  ClaimLootdropAlert,
  CLAIM_LOOTDROP_ALERT,
  Follower,
  LeaderboardAlert,
  LEADERBOARD_ALERT,
  LevelUpAlert,
  LEVELUP_ALERT,
  LootdropAlert,
  NEW_LOOTDROP_ALERT,
  NEW_SEASON_ALERT,
  PremPassAlert,
  PREM_PASS_ALERT,
  RequiredFields,
  SeasonAlert,
  ShortUrl,
  TicketRedeemBody,
  TwitchRedeemBody,
  UserInfo,
} from './microservice.dto';
import { parse } from 'postgres-array';
import { MetadataDB } from 'src/inventory/inventory.entity';
import { ClientProxy } from '@nestjs/microservices';
import { LootdropReward } from 'src/reward/reward.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Err, REDEEM_TICKET_ERROR } from 'src/common/error.interceptor';
import {
  RequiredUserPaymentOptions,
  RequiredUserSocialOptions,
  UserMissingFields,
} from 'src/graphql.schema';

@Injectable()
export class MicroserviceService {
  constructor(
    private configService: ConfigService,
    @Inject('TWITCH_SERVICE') private twitchClient: ClientProxy,
    @Inject('DISCORD_SERVICE') private discordClient: ClientProxy,
  ) {}

  sendClaimLootdropAlert(alert: ClaimLootdropAlert) {
    this.twitchClient.emit<ClaimLootdropAlert>(CLAIM_LOOTDROP_ALERT, alert);
  }

  sendLootdropAlert(alert: LootdropAlert) {
    this.twitchClient.emit<LootdropReward>(NEW_LOOTDROP_ALERT, alert);
    this.discordClient.emit<LootdropReward>(NEW_LOOTDROP_ALERT, alert);
  }

  sendLevelUpAlert(alert: LevelUpAlert) {
    this.discordClient.emit<LevelUpAlert>(LEVELUP_ALERT, alert);
  }

  sendLeaderboardAlert(alert: LeaderboardAlert) {
    this.discordClient.emit<LeaderboardAlert>(LEADERBOARD_ALERT, alert);
  }

  sendPremPassAlert(alert: PremPassAlert) {
    this.discordClient.emit<PremPassAlert>(PREM_PASS_ALERT, alert);
  }

  sendSeasonAlert(alert: SeasonAlert) {
    this.discordClient.emit<SeasonAlert>(NEW_SEASON_ALERT, alert);
  }

  async createUrl(creatorId: number) {
    const urlpayload = {
      creatorId,
    };
    const {
      data: { shortUrl },
    } = await axios
      .post<ShortUrl>(
        `${this.configService.get<string>('microservice.url.url')}/createurl`,
        urlpayload,
      )
      .catch((err) => {
        throw new Err('URL Service Failed', err, creatorId);
      });
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
      .get<Follower[]>(
        `${this.configService.get<string>(
          'microservice.user.url',
        )}/api/creator/${creatorId}/followers`,
      )
      .catch((err) => {
        throw new Err('User Service Failed', err, creatorId);
      });
    return res.data;
  }

  async getUserInfo(userAddress: string) {
    const res = await axios
      .get<UserInfo>(
        `${this.configService.get<string>('microservice.user.url')}/api/user/${userAddress}`,
        {
          headers: {
            'api-token': this.configService.get<string>('microservice.user.token'),
          },
        },
      )
      .catch((err) => {
        throw new Err('User Service Failed', err, userAddress);
      });
    return res.data;
  }

  async checkRequiredFields(
    userAddress: string,
    battlePassDB: BattlePassDB,
  ): Promise<UserMissingFields> {
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
    const requiredFields: RequiredFields = {
      userAddress,
      required_user_social_options,
      required_user_payment_options,
    };
    const missingRedeemFields = await axios
      .post<{
        missing_user_payment_options: RequiredUserPaymentOptions[];
        missing_user_social_options: RequiredUserSocialOptions[];
      }>(
        `${this.configService.get<string>('microservice.user.url')}/api/user/missingRedeemFields`,
        requiredFields,
      )
      .catch((err) => {
        throw new Err('User Service Failed', err, missingRedeemFields);
      });
    if (
      missingRedeemFields.data.missing_user_payment_options.length != 0 ||
      missingRedeemFields.data.missing_user_social_options.length != 0
    ) {
      return {
        payment: missingRedeemFields.data.missing_user_payment_options,
        social: missingRedeemFields.data.missing_user_social_options,
      };
    }
    return null;
  }

  async sendRedeemAlert(
    itemId: number,
    userAddress: string,
    creatorId: number,
    address: string,
    metadata: MetadataDB,
    contact = '',
  ) {
    const ticketRedeemBody: TicketRedeemBody = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
      contactInfo: contact.length != 0 ? contact : null,
    };
    await axios
      .post(
        `${this.configService.get<string>('microservice.ticket.url')}/api/ticket/redemption`,
        ticketRedeemBody,
      )
      .catch((err) => {
        throw new Err(REDEEM_TICKET_ERROR, err, ticketRedeemBody);
      });
    const twitchRedeemBody: TwitchRedeemBody = {
      ...metadata,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    await axios
      .post(
        `${this.configService.get<string>('microservice.twitch.url')}/redemptions/redemption`,
        twitchRedeemBody,
      )
      .catch((err) => {
        throw new Err('Twitch Service Failed', err, twitchRedeemBody);
      });
  }
}

/*
|========================| ABSTRACT |========================|
*
* These functions are used to generate swagger UI
*/

@Controller('')
export class MockController {
  @ApiOkResponse({ type: LootdropAlert })
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

  @ApiOkResponse({ type: PremPassAlert })
  @Post(PREM_PASS_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_3() {}

  @ApiOkResponse({ type: LeaderboardAlert })
  @Post(LEADERBOARD_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_4() {}

  @ApiOkResponse({ type: SeasonAlert })
  @Post(NEW_SEASON_ALERT)
  @ApiTags('TCP EVENTS')
  async mock_5() {}
}
