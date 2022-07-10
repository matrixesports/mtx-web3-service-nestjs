import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BigNumber, Contract } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { Reward } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { rewardTypeArray } from 'src/types/rewardTypeArray';

@Injectable()
export class BattlepassService {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService,
    private configService: ConfigService
  ) {}

  async getRewardForLevel(
    contract: Contract,
    id: BigNumber,
    qty: BigNumber
  ): Promise<Reward> {
    try {
      let rewardType = await contract.checkType(id);
      rewardType = rewardTypeArray[rewardType];
      let uri = await contract.uri(id);
      return {
        id: id,
        qty: qty,
        metadata: await this.metadataService.readFromIPFS(uri),
        rewardType,
      };
    } catch (e) {
      return null;
    }
  }

  async getPassContract(
    creatorId: number,
    isSigner?: boolean
  ): Promise<Contract> {
    let contractDB = await this.contractService.find({
      creator_id: creatorId,
      ctr_type: 'BattlePass',
    });
    if (isSigner) return this.contractService.getSignerContract(contractDB);
    return this.contractService.getProviderContract(contractDB);
  }

  async redeemItemHelper(
    contract: Contract,
    itemId: number,
    userAddress: string,
    creatorId: number,
    address: string
  ) {
    let uri = await contract.uri(itemId);
    let metadata = await this.metadataService.readFromIPFS(uri);
    let ticket = await axios.post(
      `${this.configService.get('SERVICE').ticket}/api/ticket/redemption`,
      {
        ...metadata,
        creatorId: creatorId,
        itemId: itemId,
        userAddress: userAddress,
        itemAddress: address,
      }
    );
    let fee = await this.contractService.getMaticFeeData();
    let ticketId = this.convertTicketToBytes32(ticket.data.data.ticketId);

    let twitch = await axios.post(
      `${this.configService.get('SERVICE').twitch}/redemptions/redemption`,
      {
        ...metadata,
        creatorId: creatorId,
        rewardId: itemId,
        userAddress: userAddress,
        itemAddress: address,
      }
    );
    await contract.redeemReward(ticketId, userAddress, itemId, fee);
  }

  convertTicketToBytes32(ticketId: string): string {
    return ticketId.replace('-', '');
  }
}
