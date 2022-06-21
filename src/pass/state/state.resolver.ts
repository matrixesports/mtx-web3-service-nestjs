// import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
// import { PassReward } from 'src/graphql.schema';
// import { GetPassDto } from '../dto/get-pass.dto';

// @Resolver('PassState')
// export class StateResolver {
//   @ResolveField()
//   async xp(@Parent() parent: GetPassDto): Promise<BigInt[]> {
//     let maxLv = await parent.contract.maxLevelInPass(parent.activeSeasonId);
//     let xp = [];
//     for (let x = 1; x <= maxLv; x++) {
//       let levelInfo = await parent.contract.passInfo(parent.activeSeasonId, x);
//       xp.push(levelInfo.xpToCompleteLevel);
//     }
//     return xp;
//   }

//   @ResolveField()
//   async maxLevel(@Parent() parent: GetPassDto): Promise<BigInt> {
//     return await parent.contract.maxLevelInPass(parent.activeSeasonId);
//   }

//   @ResolveField()
//   async freeRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
//     return await this.listAllRewards(parent, false);
//   }

//   @ResolveField()
//   async premiumRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
//     return await this.listAllRewards(parent, true);
//   }

//   async listAllRewards(info: GetPassDto, prem: boolean): Promise<PassReward[]> {
//     let maxLv = await info.contract.maxLevels(info.activeSeasonId);
//     let rewards = [];
//     for (let x = 1; x <= maxLv; x++) {
//       let bundle = await info.contract.passInfo(info.activeSeasonId, x);
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
// }
