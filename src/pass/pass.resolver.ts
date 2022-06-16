import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractService } from 'src/contract/contract.service';
import { GetPassArgsDto } from './dto/get-pass-args.dto';
import { GetPassDto } from './dto/get-pass.dto';
import { GetPassUserInfoArgsDto } from './user/dto/get-pass-user-info-args.dto';
import { GetPassUserInfoDto } from './user/dto/get-pass-user-info.dto';

@Resolver('Pass')
export class PassResolver {
  constructor(private contractService: ContractService) {}

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
