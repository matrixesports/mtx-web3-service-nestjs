import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractService } from 'src/contract/contract.service';
import { PassReward } from 'src/graphql.schema';
import { GetPassArgsDto } from './dto/get-pass-args.dto';
import { GetPassUserInfoArgsDto } from './dto/get-pass-user-info-args.dto';
import { GetPassUserInfoDto } from './dto/get-pass-user-info.dto';
import { GetPassDto } from './dto/get-pass.dto';
import { PassService } from './pass.service';
  @ResolveField()
  async xp(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    let userInfo = await parent.contract.userInfo(
      parent.userAddress,
      parent.activePassId,
    );
    return userInfo.xp;
  }

  @ResolveField()
  async level(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    return await parent.contract.level(parent.userAddress, parent.activePassId);
  }

  @ResolveField()
  async unclaimedFreeRewards(
    @Parent() parent: GetPassUserInfoDto,
  ): Promise<PassReward[]> {
    return await this.listUnclaimedRewards(parent, false);
  }

  @ResolveField()
  async premium(
    @Parent() parent: GetPassUserInfoDto,
  ): Promise<GetPassUserInfoDto | null> {
    let prem = await parent.contract.isUserPremium(
      parent.userAddress,
      parent.activePassId,
    );
    if (prem) {
      return parent;
    } else {
      return null;
    }
  }

  @Resolver('PremiumPassUser')
  @ResolveField()
  async owned(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    return await parent.contract.balanceOf(
      parent.userAddress,
      parent.activePassId,
    );
  }

  @Resolver('PremiumPassUser')
  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetPassUserInfoDto,
  ): Promise<PassReward[]> {
    return await this.listUnclaimedRewards(parent, true);
  }
@Resolver('Pass')
export class PassResolver {
  constructor(
    private contractService: ContractService,
    private passService: PassService,
  ) {}

  @Query()
  async getPass(@Args() args: GetPassArgsDto): Promise<GetPassDto> {
    let contractDB = await this.contractService.findOneBy({
      creator_id: args.creatorId,
    });
    let contract = await this.contractService.create(contractDB);
    let activePassId = await contract.passId();
    return { contract, contractDB, activePassId };
  }

  @ResolveField()
  token(@Parent() parent: GetPassDto): GetPassDto {
    return parent;
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetPassDto,
    @Args() args: GetPassUserInfoArgsDto,
  ): GetPassUserInfoDto {
    return { ...parent, userAddress: args.userAddress };
  }

  @ResolveField()
  state(@Parent() parent: GetPassDto): GetPassDto {
    return parent;
  }

  //   @Resolver('PassState')
  //   @ResolveField('xp')
  //   async stateXp(@Parent() parent: GetPassDto): Promise<BigInt[]> {
  //     let maxLv = await parent.contract.maxLevelInPass(parent.activePassId);
  //     let xp = [];
  //     for (let x = 1; x <= maxLv; x++) {
  //       let levelInfo = await parent.contract.passInfo(parent.activePassId, x);
  //       xp.push(levelInfo.xpToCompleteLevel);
  //     }
  //     return xp;
  //   }

  //   @Resolver('PassState')
  //   @ResolveField()
  //   async maxLevel(@Parent() parent: GetPassDto): Promise<BigInt> {
  //     return await parent.contract.maxLevelInPass(parent.activePassId);
  //   }

  //   @Resolver('PassState')
  //   @ResolveField()
  //   async freeRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
  //     return await this.listAllRewards(parent, false);
  //   }

  //   @Resolver('PassState')
  //   @ResolveField()
  //   async premiumRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
  //     return await this.listAllRewards(parent, true);
  //   }

  //   async listUnclaimedRewards(
  //     info: GetPassUserInfoDto,
  //     prem: boolean,
  //   ): Promise<PassReward[]> {
  //     let currentLevel = await info.contract.level(
  //       info.userAddress,
  //       info.activePassId,
  //     );
  //     let unclaimedRewards = [];
  //     //current level of 3 means, u are eligible for rewards at level 3
  //     for (let x = 1; x <= currentLevel; x++) {
  //       let res = await info.contract.getUserInfo(
  //         info.userAddress,
  //         info.activePassId,
  //         x,
  //         prem,
  //       );
  //       // res is xp, prem, claimed
  //       if (res[2]) {
  //         //nothin;
  //       } else {
  //         let reward = await info.contract.passInfo(info.activePassId, x);
  //         let bundle;
  //         if (prem) {
  //           bundle = reward.premiumReward;
  //         } else {
  //           bundle = reward.freeReward;
  //         }
  //         if (
  //           bundle.erc20s.addresses.length == 0 &&
  //           bundle.erc721s.addresses.length == 0 &&
  //           bundle.erc1155s.addresses.length == 0
  //         ) {
  //           continue;
  //         }
  //         unclaimedRewards.push({
  //           level: x,
  //           bundle: bundle,
  //         });
  //       }
  //     }
  //     return unclaimedRewards;
  //   }

  //   async listAllRewards(info: GetPassDto, prem: boolean): Promise<PassReward[]> {
  //     let maxLv = await info.contract.maxLevels(info.activePassId);
  //     let rewards = [];
  //     for (let x = 1; x <= maxLv; x++) {
  //       let bundle = await info.contract.passInfo(info.activePassId, x);
  //       if (prem) {
  //         rewards.push({
  //           level: x,
  //           bundle: bundle.premiumReward,
  //         });
  //       } else {
  //         rewards.push({
  //           level: x,
  //           bundle: bundle.freeReward,
  //         });
  //       }
  //     }
  //     return rewards;
  //   }

  // async claimReward(
  //             parent: any,
  //             args: ClaimReward,
  //             context: ContextObj
  //         ): Promise<MutationResponse> {
  //             try {
  //                 let creatorInfo = await getCreatorInfo(args.input.creatorId);
  //                 if (creatorInfo == null) {
  //                     return {
  //                         success: false,
  //                         description: `Error getting creator Info, id: ${args.input.creatorId}, contact matrix on discord`,
  //                     };
  //                 }
  //                 let contractInfo = await getContractInfo(creatorInfo.pass);
  //                 if (contractInfo == null) {
  //                     return {
  //                         success: false,
  //                         description: `Error getting contract Info, ${creatorInfo.pass}, contact matrix on discord`,
  //                     };
  //                 }
  //                 let provider = await getProvider(contractInfo.network);
  //                 let ctr = await getSignerContract(
  //                     creatorInfo.pass,
  //                     contractInfo.abi,
  //                     contractInfo.network
  //                 );

  //                 let fee = await getMaticFeeData();
  //                 let tx = await ctr.claimReward(
  //                     creatorInfo.active_pass_id,
  //                     context.user,
  //                     args.input.level,
  //                     args.input.premium,
  //                     fee
  //                 );
  //                 await provider.waitForTransaction(tx.hash, MATIC_NUMBER_OF_BLOCKS_TO_WAIT);
  //                 console.log("CLAIMED", args.input);

  //                 let reward = await ctr.reward(
  //                     creatorInfo.active_pass_id,
  //                     args.input.level,
  //                     args.input.premium
  //                 );
  //                 for (let x = 0; )
  //                 return {
  //                     success: true,
  //                     description: "nice",
  //                 };
  //             } catch (e) {
  //                 console.log("CANNOT CLAIM REWARD", args.input, e);
  //                 return {
  //                     success: false,
  //                     description: "error, contact matrix on discord",
  //                 };
  //             }
  //         }
}
