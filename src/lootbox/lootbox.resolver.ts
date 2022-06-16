import { Resolver } from '@nestjs/graphql';

@Resolver()
export class LootboxResolver {
  // async getLootboxOptions(
  //         parent: any,
  //         args: GetLootboxOptionArgs
  //     ): Promise<Array<TokenBundle> | null> {
  //         try {
  //             let contractDB: ContractsDB | null = await getContractInfo(args.lootboxAddress);
  //             if (contractDB == null) {
  //                 return null;
  //             }
  //             let contract = await getProviderContract(
  //                 contractDB.address,
  //                 contractDB.abi,
  //                 await getProvider(contractDB.network)
  //             );
  //             return await contract.rewards(args.lootboxId);
  //         } catch (e) {
  //             console.log(e);
  //             return null;
  //         }
  //     },
  //     async openLootbox(
  //         parent: any,
  //         args: OpenLootbox,
  //         context: ContextObj
  //     ): Promise<MutationResponse> {
  //         try {
  //             let contractInfo = await getContractInfo(args.input.lootboxAdddress);
  //             if (contractInfo == null) {
  //                 return {
  //                     success: false,
  //                     description: `Error getting contract Info, ${args.input.lootboxAdddress}, contact matrix on discord`,
  //                 };
  //             }
  //             let provider = await getProvider(contractInfo.network);
  //             let ctr = await getSignerContract(
  //                 args.input.lootboxAdddress,
  //                 contractInfo.abi,
  //                 contractInfo.network
  //             );
  //             let fee = await getMaticFeeData();
  //             let tx = await ctr.openLootbox(args.input.lootboxId, context.user, fee);
  //             await provider.waitForTransaction(tx.hash, MATIC_NUMBER_OF_BLOCKS_TO_WAIT);
  //             console.log("OPENED LOOTBOX", args.input);
  //             return {
  //                 success: true,
  //                 description: "nice",
  //             };
  //         } catch (e) {
  //             console.log("CANNOT OPEN LOOTBOX", args.input, e);
  //             return {
  //                 success: false,
  //                 description: "error, contact matrix on discord",
  //             };
  //         }
  //     },
}
