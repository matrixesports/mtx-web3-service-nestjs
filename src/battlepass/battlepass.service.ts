import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber, Contract } from 'ethers';
import { parse } from 'postgres-array';
import { BattlePass } from 'src/common/typechain';
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
  async getBattlePassContract(creatorId: number, isSigner?: boolean) {
    const contractDB = await this.contractService.findOne({
      creator_id: creatorId,
      ctr_type: CtrType.BATTLE_PASS,
    });

    if (isSigner)
      return this.contractService.getSignerContract(contractDB) as BattlePass;
    return this.contractService.getProviderContract(contractDB) as BattlePass;
  }

  /**
   * get metadata from fs
   * @param creatorId
   * @param id
   * @returns
   */
  async getMetadata(creatorId: number, id: number): Promise<RewardMetadata> {
    try {
      const metadata = await import(
        `${process.cwd()}/creators/${creatorId}/metadata/${id}.json`
      );
      return metadata.default;
    } catch (e) {
      return null;
    }
  }

  /**
   *
   * @param rewardTypeIdx
   * @returns return type of reward
   */
  getRewardType(rewardTypeIdx: number): RewardType {
    return rewardTypeArray[rewardTypeIdx];
  }

  async getRewardTypeForId(contract: Contract, id: BigNumber) {
    const rewardType = await contract.checkType(id);
    return this.getRewardType(rewardType);
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
    contract: Contract,
    id: BigNumber,
    qty: BigNumber,
    creatorId: number
  ): Promise<Reward> {
    if (id.isZero()) return null;
    const metadata = await this.getMetadata(creatorId, id.toNumber());
    const rewardType = await this.getRewardTypeForId(contract, id);
    return {
      id,
      qty,
      metadata,
      rewardType,
      creatorId,
    };
  }

  async createRewardObjWithRewardType(
    id: BigNumber,
    qty: BigNumber,
    creatorId: number,
    rewardTypeIdx: number
  ): Promise<Reward> {
    if (id.isZero()) return null;
    const metadata = await this.getMetadata(creatorId, id.toNumber());
    const rewardType = this.getRewardType(rewardTypeIdx);
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
    contract: BattlePass,
    itemId: number,
    userAddress: string,
    creatorId: number,
    address: string
  ) {
    const metadata = await this.getMetadata(creatorId, itemId);

    const ticketRedeemBody: TicketRedeemBody = {
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

    const twitchRedeemBody: TwitchRedeemBody = {
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

    const fee = await this.contractService.getMaticFeeData();
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
    const battlePassDB = await this.getBattlePassDB(address);
    if (
      battlePassDB.required_user_social_options.length == 0 &&
      battlePassDB.required_user_payment_options.length == 0
    )
      return;

    //convert string to array
    const required_user_social_options = parse(
      battlePassDB.required_user_social_options,
      value => value
    );
    const required_user_payment_options = parse(
      battlePassDB.required_user_payment_options,
      value => value
    );

    const requiredFieldsBody: RequiredFieldsBody = {
      userAddress,
      required_user_social_options,
      required_user_payment_options,
    };
    const missingRedeemFields = await axios.post(
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
    contract: BattlePass,
    id: number,
    userAddress: string,
    creatorId: number
  ): Promise<Reward[]> {
    fee['gasLimit'] = 1000000;
    const tx = await contract.openLootbox(id, userAddress, fee);
    const rc = await tx.wait();
    const event = rc.events?.find(event => event.event === 'LootboxOpened');
    const [idxOpened] = event.args;
    const option = await contract.getLootboxOptionByIdx(id, idxOpened);
    const rewards = [];
    for (let y = 0; y < option[1].length; y++) {
      const rewardType = await contract.checkType(option[1][y]);
      rewards.push(
        await this.createRewardObj(
          contract,
          option[1][y],
          option[2][y],
          creatorId
        )
      );
    }
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
