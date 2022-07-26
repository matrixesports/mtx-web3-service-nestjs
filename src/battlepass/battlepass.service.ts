import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber, Contract } from 'ethers';
import { parse } from 'postgres-array';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { Reward, RewardMetadata, RewardType } from 'src/graphql.schema';
import { Repository } from 'typeorm';
import { BattlePass as BattlePassDB } from './battlepass.entity';

export const rewardTypeArray = Object.values(RewardType);

@Injectable()
export class BattlePassService {
  constructor(
    private contractService: ContractService,
    private configService: ConfigService,
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>
  ) {}

  /**
   * get info from battlepass db
   * @param address contract address
   * @returns throws error if cant find it else return db object
   */
  async getBattlePassDB(address: string): Promise<BattlePassDB> {
    return await this.battlePassRepository.findOneByOrFail({
      address: address,
    });
  }

  /**
   * get battle pass contract
   * @param creatorId
   * @param isSigner true if connected to signer
   * @returns throws error if cannot find contract
   */
  async getBattlePassContract(
    creatorId: number,
    isSigner?: boolean
  ): Promise<Contract> {
    let contractDB = await this.contractService.findOne({
      creator_id: creatorId,
      ctr_type: CtrType.BATTLE_PASS,
    });

    if (isSigner) return this.contractService.getSignerContract(contractDB);
    return this.contractService.getProviderContract(contractDB);
  }

  /**
   * get metadata from fs
   * @param creatorId
   * @param id
   * @returns
   */
  async getMetadata(creatorId: number, id: number): Promise<RewardMetadata> {
    let metadata = await import(
      `${process.cwd()}/creators/${creatorId}/metadata/${id}.json`
    );
    return metadata.default;
  }

  /**
   *
   * @param rewardType
   * @returns return type of reward
   */
  getRewardType(rewardTypeIdx: number): RewardType {
    return rewardTypeArray[rewardTypeIdx];
  }

  async getRewardTypeForId(contract: Contract, id: BigNumber) {
    let rewardType = await contract.checkType(id);
    return await this.getRewardType(rewardType);
  }

  /**
   * create reward object
   * @param id
   * @param qty
   * @param creatorId
   * @param rewardType
   * @returns
   */
  async createRewardObj(
    id: BigNumber,
    qty: BigNumber,
    creatorId: number,
    rewardTypeIdx: number
  ): Promise<Reward> {
    if (id.isZero()) return null;
    let metadata = await this.getMetadata(creatorId, id.toNumber());
    let rewardType = this.getRewardType(rewardTypeIdx);
    return {
      id,
      qty,
      metadata,
      rewardType,
      creatorId,
    };
  }

  /**
   * helper when item is redeemed
   * @param contract
   * @param itemId
   * @param userAddress
   * @param creatorId
   * @param address
   */
  async redeemItemHelper(
    contract: Contract,
    itemId: number,
    userAddress: string,
    creatorId: number,
    address: string
  ) {
    let metadata = await this.getMetadata(creatorId, itemId);

    let ticketRedeemBody: TicketRedeemBody = {
      ...metadata,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    await axios.post(
      `${this.configService.get('SERVICE').ticket}/api/ticket/redemption`,
      ticketRedeemBody
    );

    let twitchRedeemBody: TwitchRedeemBody = {
      ...metadata,
      creatorId: creatorId,
      itemId: itemId,
      userAddress: userAddress,
      itemAddress: address,
    };
    await axios.post(
      `${this.configService.get('SERVICE').twitch}/redemptions/redemption`,
      twitchRedeemBody
    );

    let fee = await this.contractService.getMaticFeeData();
    await contract.burn(userAddress, itemId, 1, fee);
  }

  /**
   * check what contact info is needed for a season
   * only called for level 1
   * @param userAddress
   * @param address of contract
   * @returns
   */
  async checkRequiredFields(
    userAddress: string,
    address: string,
    level: number
  ): Promise<RequiredFieldsResponse> {
    if (level != 1) return;
    let battlePassDB = await this.getBattlePassDB(address);
    if (
      battlePassDB.required_user_social_options.length == 0 &&
      battlePassDB.required_user_payment_options.length == 0
    )
      return;

    //convert string to array
    let required_user_social_options = parse(
      battlePassDB.required_user_social_options,
      value => value
    );
    let required_user_payment_options = parse(
      battlePassDB.required_user_payment_options,
      value => value
    );

    let requiredFieldsBody: RequiredFieldsBody = {
      userAddress,
      required_user_social_options,
      required_user_payment_options,
    };
    let missingRedeemFields = await axios.post(
      `${this.configService.get('SERVICE').user}/api/user/missingRedeemFields`,
      requiredFieldsBody
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
    } else {
      return;
    }
  }

  async openLootbox(
    fee: any,
    contract: Contract,
    id: number,
    userAddress: string,
    creatorId: number
  ): Promise<Reward[]> {
    fee['gasLimit'] = 1000000;
    let tx = await contract.openLootbox(id, userAddress, fee);
    let rc = await tx.wait();
    let event = rc.events?.find(event => event.event === 'LootboxOpened');
    const [idxOpened] = event.args;
    console.log(idxOpened);
    let option = await contract.getLootboxOptionByIdx(id, idxOpened);
    console.log(option);
    let rewards = [];
    for (let y = 0; y < option[0].ids.length; y++) {
      let rewardType = await contract.checkType();
      rewards.push(
        await this.createRewardObj(
          option[0].ids[y],
          option[0].qtys[y],
          creatorId,
          rewardType
        )
      );
    }
    console.log(rewards);
    return rewards;
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
