// import {
//   Args,
//   Context,
//   Parent,
//   Query,
//   ResolveField,
//   Resolver,
// } from '@nestjs/graphql';
// import { ContractService } from 'src/contract/contract.service';

// @Resolver('Inventory')
// export class InventoryResolver {
//   constructor(private contractService: ContractService) {}

//   //   @Query()
//   //   async getInventory() {
//   //     let contractDB = await this.contractService.findOneBy({
//   //       creator_id: args.creatorId,
//   //     });
//   //     let contract = await this.contractService.create(contractDB);
//   //     let activeSeasonId = await contract.seasonId();
//   //     return { contract, contractDB, activeSeasonId };
//   //   }

//   //   @ResolveField()
//   //   async erc20Rewards(@Context() ctx) {
//   //     let contractDbs = await this.contractService.find({ ctr_type: 'MERC20' });
//   //     let erc20s = [];
//   //     for (let x = 0; x < contractDbs.length; x++) {
//   //       let contract = await this.contractService.create(contractDbs[x]);
//   //       let qty = await contract.balanceOf(ctx.user);
//   //       if (qty == 0) continue;
//   //       erc20s.push({
//   //         contractDB: contractDbs[x],
//   //         contract,
//   //         qty,
//   //       });
//   //     }
//   //     return erc20s;
//   //   }

//   //   @ResolveField()
//   //   async erc721Rewards(@Context() ctx) {
//   //     let contractDbs = await this.contractService.find({ ctr_type: 'MERC721' });
//   //     return await tokenWithNftBalances(contractDbs, ctx.user);
//   //   }

//   //   //TODO: pass,default, lootbox,crafting are default rewards
//   //   @ResolveField()
//   //   async erc1155Rewards(@Context() ctx) {
//   //     let contractDbs = await this.contractService.find({ ctr_type: 'MERC1155' });
//   //     return await tokenWithNftBalances(contractDbs, ctx.user);
//   //   }

//   //    //if record does not exist in db then unredeemed
//   //         async redeemable(
//   //             parent: any,
//   //             args: any,
//   //             context: ContextObj
//   //         ): Promise<Redeemable | null> {
//   //             let ctrs = await query(
//   //                 "SELECT * from Contracts WHERE contract_type = $1 AND reward_type = $2",
//   //                 ["ERC1155", "Redeemable"]
//   //             );
//   //             if (ctrs == null) return null;
//   //             let unredeemed = await tokenWithNftBalances(
//   //                 ctrs.rows,
//   //                 context.user
//   //             );

//   //             let redeemed = [];
//   //             //get all unique addresses that user has redeemed
//   //             let redeemed_addresses = await query(
//   //                 "SELECT DISTINCT redeemable_address from redeemable where user_address = $1",
//   //                 [context.user]
//   //             );
//   //             if (redeemed_addresses == null) return { unredeemed, redeemed: [] };

//   //             //loop over all unique addys
//   //             for (let x = 0; x < redeemed_addresses.rowCount; x++) {
//   //                 //get unique ids the user has interacted with for one address
//   //                 let unique_ids = await query(
//   //                     "SELECT DISTINCT redeemable_id from redeemable where user_address = $1 AND redeemable_address = $2",
//   //                     [
//   //                         context.user,
//   //                         redeemed_addresses.rows[x].redeemable_address,
//   //                     ]
//   //                 );
//   //                 if (unique_ids == null) continue;
//   //                 let contract = await getContractFromAddress(
//   //                     redeemed_addresses.rows[x].redeemable_address,
//   //                     false,
//   //                     false
//   //                 );
//   //                 if (contract == null) continue;
//   //                 let ctrInfo = await getContractInfo(
//   //                     redeemed_addresses.rows[x].redeemable_address
//   //                 );
//   //                 if (ctrInfo == null) continue;

//   //                 //loop over unique ids
//   //                 for (let y = 0; y < unique_ids.rowCount; y++) {
//   //                     let status = [];
//   //                     let redeemed_entries = await query(
//   //                         "SELECT status from redeemable where user_address = $1 AND redeemable_address = $2 AND redeemable_id = $3",
//   //                         [
//   //                             context.user,
//   //                             redeemed_addresses.rows[x].redeemable_address,
//   //                             unique_ids.rows[y].redeemable_id,
//   //                         ]
//   //                     );
//   //                     if (redeemed_entries == null) continue;
//   //                     //loop over all interactions for a given address, id
//   //                     for (let z = 0; z < redeemed_entries.rowCount; z++) {
//   //                         status.push(redeemed_entries.rows[z].status);
//   //                     }

//   //                     redeemed.push({
//   //                         status,
//   //                         token: {
//   //                             contractDB: ctrInfo,
//   //                             contract: contract,
//   //                             qty: ethers.BigNumber.from(0),
//   //                             id: ethers.BigNumber.from(
//   //                                 unique_ids.rows[y].redeemable_id
//   //                             ),
//   //                         },
//   //                     });
//   //                 }
//   //             }
//   //             return {
//   //                 unredeemed,
//   //                 redeemed,
//   //             };
//   //         },
//   //         async lootbox(
//   //             parent: any,
//   //             args: any,
//   //             context: ContextObj
//   //         ): Promise<Array<ERC1155>> {
//   //             let ctrs = await query(
//   //                 "SELECT * from Contracts WHERE contract_type = $1 AND reward_type = $2",
//   //                 ["ERC1155", "Lootbox"]
//   //             );
//   //             if (ctrs == null) return [];
//   //             return await tokenWithNftBalances(ctrs.rows, context.user);
//   //         },
//   //     },
//   // };

//   // export async function tokenWithNftBalances(
//   //     contractsWithDbInfo: Array<ContractsDB>,
//   //     userAddress: string
//   // ) {
//   //     let tokens = [];
//   //     let nftsForUser = await getNFTSOwnedForUser(
//   //         contractsWithDbInfo.map((x: ContractsDB) => x.address),
//   //         userAddress
//   //     );

//   //     for (let x = 0; x < nftsForUser.length; x++) {
//   //         let contract = await getContractFromAddress(
//   //             nftsForUser[x].contract.address,
//   //             false,
//   //             false
//   //         );
//   //         if (contract == null) continue;
//   //         let contractInfo = contractsWithDbInfo.find(
//   //             (x: ContractsDB) => x.address == contract?.address
//   //         );
//   //         if (contractInfo == null) continue;
//   //         tokens.push({
//   //             contractDB: contractInfo,
//   //             contract,
//   //             qty: ethers.BigNumber.from(nftsForUser[x].balance),
//   //             id: ethers.BigNumber.from(nftsForUser[x].id.tokenId),
//   //         });
//   //     }
//   // return tokens;
// }
