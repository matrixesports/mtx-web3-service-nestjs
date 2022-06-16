import { Resolver } from '@nestjs/graphql';

@Resolver()
export class RedeemableResolver {
  // async redeemItem(
  //         parent: any,
  //         args: RedeemItem,
  //         context: ContextObj
  //     ): Promise<MutationResponse> {
  //         try {
  //             let contractInfo = await getContractInfo(args.input.redeemableAddress);
  //             if (contractInfo == null) {
  //                 return {
  //                     success: false,
  //                     description: `Error getting contract Info, ${args.input.redeemableAddress}`,
  //                 };
  //             }
  //             let provider = await getProvider(contractInfo.network);
  //             let ctr = await getSignerContract(
  //                 args.input.redeemableAddress,
  //                 contractInfo.abi,
  //                 contractInfo.network
  //             );
  //             let balance = await ctr.balanceOf(context.user, args.input.itemId);
  //             if (balance.toNumber() == 0) {
  //                 return {
  //                     success: false,
  //                     description: "Item not owned!",
  //                 };
  //             }
  //             //send to ticket service
  //             let metadata = await readFromIPFS(await ctr.uri(args.input.itemId));
  //             let ticket = await axios.post(`${TICKET_SERVICE_URL}/api/ticket/redemption`, {
  //                 ...metadata,
  //                 creatorId: args.input.creatorId,
  //                 itemId: args.input.itemId,
  //                 userAddress: context.user,
  //                 itemAddress: args.input.redeemableAddress,
  //             });
  //             let res = await addRedeemableItem({
  //                 ticket_id: ticket.data.data.ticketId,
  //                 user_address: context.user,
  //                 redeemable_address: args.input.redeemableAddress,
  //                 redeemable_id: args.input.itemId,
  //                 status: "Processing",
  //             });
  //             if (!res) {
  //                 console.error();
  //                 return {
  //                     success: false,
  //                     description: "Item cannot be redeemed, contact matrix on discord",
  //                 };
  //             }
  //             let fee = await getMaticFeeData();
  //             let tx = await ctr.burn(context.user, args.input.itemId, 1, fee);
  //             await provider.waitForTransaction(tx.hash, MATIC_NUMBER_OF_BLOCKS_TO_WAIT);
  //             return {
  //                 success: true,
  //                 description: "Success",
  //             };
  //         } catch (e) {
  //             console.log("Error while redeememing, contact matrix on discord", args.input, e);
  //             return {
  //                 success: false,
  //                 description: "error",
  //             };
  //         }
  //     },
}
