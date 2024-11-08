import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { RewardService } from './reward.service';
import { GetLootdropDto, LootdropRS, NewLootdrops } from './reward.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { plainToInstance } from 'class-transformer';

@Resolver('Lootdrop')
export class LootdropResolver {
  constructor(private rewardService: RewardService, private inventoryService: InventoryService) {}

  @Query()
  async getLootdrop(
    @Args('creatorId') creatorId: number,
    @Args('lootdropId') lootdropId: string,
  ): Promise<LootdropRS> {
    return await this.rewardService.getlootdrop(creatorId, lootdropId);
  }

  @Query()
  async getLootdrops(@Args('creatorId') creatorId: number): Promise<LootdropRS[]> {
    return await this.rewardService.getlootdrops(creatorId);
  }

  @Mutation()
  async claimLootdrop(
    @Args('creatorId') creatorId: number,
    @Args('contact') contact: string,
    @Args('lootdropId') lootdropId: string,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    return await this.rewardService.claimLootdrop(creatorId, userAddress, contact, lootdropId);
  }

  @Query()
  async getClaimedLootdrops(@Args('creatorId') creatorId: number, @Context() context) {
    const userAddress: string = context.req.headers['user-address'];
    return await this.rewardService.getClaimedLootdrops(creatorId, userAddress);
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
