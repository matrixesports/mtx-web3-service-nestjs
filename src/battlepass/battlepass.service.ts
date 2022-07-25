import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber, Contract } from 'ethers';
import { parse } from 'postgres-array';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { Reward } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { rewardTypeArray } from 'src/types/rewardTypeArray';
import { Repository } from 'typeorm';
import { BattlePass as BattlePassDB } from './battlepass.entity';
@Injectable()
export class BattlePassService {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService,
    private configService: ConfigService,
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>
  ) {}

  async getBattlePassMetadata(address: string): Promise<BattlePassDB> {
    return await this.battlePassRepository.findOneByOrFail({
      address: address,
    });
  }

  async getRewardForLevel(
    contract: Contract,
    id: BigNumber,
    qty: BigNumber,
    creatorId: number
  ): Promise<Reward> {
    try {
      let rewardType = await contract.checkType(id);
      rewardType = rewardTypeArray[rewardType];
      //   let uri = await contract.uri(id);
      return {
        id: id,
        qty: qty,
        // metadata: await this.metadataService.readFromIPFS(uri),
        metadata: null,
        rewardType,
        creatorId,
      };
    } catch (e) {
      return null;
    }
  }

  async getPassContract(
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

  /// notify redemption service and notify twitch service
  /// errors bubble up
  async redeemItemHelper(
    contract: Contract,
    itemId: number,
    userAddress: string,
    creatorId: number,
    address: string
  ) {
    let uri = await contract.uri(itemId);
    let metadata = await this.metadataService.readFromIPFS(uri);

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
    address: string
  ): Promise<RequiredFieldsResponse> {
    //will throw error if address does not exist
    let battlePassDB = await this.getBattlePassMetadata(address);

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
    return missingRedeemFields.data;
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
