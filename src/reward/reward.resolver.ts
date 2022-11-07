import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { RewardService } from './reward.service';
import { GetLootdropDto, LootdropRS } from './reward.dto';
import { InventoryService } from 'src/inventory/inventory.service';

@Resolver('Lootdrop')
export class LootdropResolver {
  constructor(private rewardService: RewardService, private inventoryService: InventoryService) {}

  @Query('getLootdrop')
  async getlootdrop(@Args('creatorId') creatorId: number): Promise<LootdropRS> {
    return this.rewardService.getlootdrop(creatorId);
  }

  @Mutation('claimLootdrop')
  async claimLootdrop(
    @Args('creatorId') creatorId: number,
    @Args('contact') contact: string,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    return this.rewardService.claimLootdrop(creatorId, userAddress, contact);
  }

  @ResolveField()
  async reward(@Parent() parent: GetLootdropDto) {
    return await this.inventoryService.createRewardObj(parent.creatorId, parent.rewardId, 1);
  }

  @ResolveField()
  requirements(@Parent() parent: GetLootdropDto) {
    return parent.requirements;
  }

  @ResolveField()
  threshold(@Parent() parent: GetLootdropDto) {
    return parent.threshold;
  }

  @ResolveField()
  start(@Parent() parent: GetLootdropDto) {
    return new Date(parent.start);
  }

  @ResolveField()
  end(@Parent() parent: GetLootdropDto) {
    return new Date(parent.end);
  }

  @ResolveField()
  url(@Parent() parent: GetLootdropDto) {
    return parent.url;
  }
}
