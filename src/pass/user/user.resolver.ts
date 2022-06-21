// import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
// import { PassReward } from 'src/graphql.schema';
// import { GetPassUserInfoDto } from './dto/get-pass-user-info.dto';

// @Resolver('PassUser')
// export class UserResolver {
//   @ResolveField()
//   async xp(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
//     let userInfo = await parent.contract.userInfo(
//       parent.userAddress,
//       parent.activeSeasonId,
//     );
//     return userInfo.xp;
//   }

//   @ResolveField()
//   async level(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
//     return await parent.contract.level(
//       parent.userAddress,
//       parent.activeSeasonId,
//     );
//   }

//   @ResolveField()
//   async unclaimedFreeRewards(
//     @Parent() parent: GetPassUserInfoDto,
//   ): Promise<PassReward[]> {
//     let currentLevel = await parent.contract.level(
//       parent.userAddress,
//       parent.activeSeasonId,
//     );
//     let unclaimedRewards = [];
//     //current level of 3 means, u are eligible for rewards at level 3
//     for (let x; x <= currentLevel; x++) {
//       let claimed = await parent.contract.isRewardClaimed(
//         parent.userAddress,
//         parent.activeSeasonId,
//         x,
//         false,
//       );
//       if (!claimed) {
//         let reward = await parent.contract.passInfo(parent.activeSeasonId, x);
//         let bundle = reward.freeReward;
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

//   @ResolveField()
//   async premium(
//     @Parent() parent: GetPassUserInfoDto,
//   ): Promise<GetPassUserInfoDto | null> {
//     let prem = await parent.contract.isUserPremium(
//       parent.userAddress,
//       parent.activeSeasonId,
//     );
//     if (prem) {
//       return parent;
//     } else {
//       return null;
//     }
//   }
// }
