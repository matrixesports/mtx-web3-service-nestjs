import { ConfigService } from '@nestjs/config';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';

@Resolver('BattlePass')
export class BattlepassResolver {
  constructor(private contractService: ContractService) {}

  @ResolveField()
  async name(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  description(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  price(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  currency(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  endDate(@Parent() parent: GetBattlePassChildDto) {
    return new Date();
  }

  @ResolveField()
  seasonId(@Parent() parent: GetBattlePassChildDto) {
    return ethers.BigNumber.from(1);
  }

  @ResolveField()
  levelInfo(@Parent() parent: GetBattlePassChildDto) {
    return [];
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetBattlePassChildDto,
    @Args('userAddress') userAddress: string
  ) {
    return {};
  }

  @Query()
  getBattlePass(@Args('creatorId') creatorId: number): GetBattlePassChildDto {
    return { creatorId };
  }
}
