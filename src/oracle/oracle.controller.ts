// import { Controller } from '@nestjs/common';

// @Controller('oracle')
// export class OracleController {
//   // router.post("/", async (req, res) => {
//   // try {
//   //     let creatorInfo: CreatorsDB | null = await getCreatorInfo(
//   //         req.body.creatorId
//   //     );
//   //     if (creatorInfo == null) {
//   //         return res.send({ sucess: false });
//   //     }
//   //     let contractInfo: ContractsDB | null = await getContractInfo(
//   //         creatorInfo.pass
//   //     );
//   //     if (contractInfo == null) {
//   //         return res.send({ sucess: false });
//   //     }
//   //     let provider: providers.Provider = await getProvider(
//   //         contractInfo.network
//   //     );
//   //     let ctr: Contract = await getOracleSignerContract(
//   //         creatorInfo.pass,
//   //         contractInfo.abi,
//   //         contractInfo.network
//   //     );
//   //     let fee = await getMaticFeeData();
//   //     let tx = await ctr.giveXp(
//   //         creatorInfo.active_pass_id,
//   //         req.body.xp,
//   //         req.body.userAddress,
//   //         fee
//   //     );
//   //     await provider.waitForTransaction(
//   //         tx.hash,
//   //         MATIC_NUMBER_OF_BLOCKS_TO_WAIT
//   //     );
//   //     res.send({
//   //         success: true,
//   //     });
//   // } catch (e) {
//   //     console.log(e);
//   //     res.send({ success: false });
//   // }
// }
