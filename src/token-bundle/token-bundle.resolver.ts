// import { Resolver } from '@nestjs/graphql';

// @Resolver('TokenBundle')
// export class TokenBundleResolver {
//   // async bundles20(parent: TokenBundle): Promise<Array<ERC20>> {
//   //         //if no rewards then return null
//   //         if (parent.bundles20.addresses.length == 0) {
//   //             return [];
//   //         }
//   //         let erc20s = [];
//   //         for (let x = 0; x < parent.bundles20.addresses.length; x++) {
//   //             try {
//   //                 let contractDB = await getContractInfo(
//   //                     parent.bundles20.addresses[x]
//   //                 );
//   //                 if (contractDB == null) continue;
//   //                 let contract = await getProviderContract(
//   //                     contractDB.address,
//   //                     contractDB.abi,
//   //                     await getProvider(contractDB.network)
//   //                 );
//   //                 erc20s.push({
//   //                     contractDB,
//   //                     contract,
//   //                     qty: parent.bundles20.qtys[x],
//   //                 });
//   //             } catch (e) {
//   //                 console.log(e);
//   //                 continue;
//   //             }
//   //         }
//   //         return erc20s;
//   //     },
//   //     async bundles721(parent: TokenBundle): Promise<Array<ERC721>> {
//   //         if (parent.bundles721.addresses.length == 0) {
//   //             return [];
//   //         }
//   //         let erc721s = [];
//   //         for (let x = 0; x < parent.bundles721.addresses.length; x++) {
//   //             try {
//   //                 let contractDB = await getContractInfo(
//   //                     parent.bundles721.addresses[x]
//   //                 );
//   //                 if (contractDB == null) continue;
//   //                 let contract = await getProviderContract(
//   //                     contractDB.address,
//   //                     contractDB.abi,
//   //                     await getProvider(contractDB.network)
//   //                 );
//   //                 erc721s.push({
//   //                     contractDB,
//   //                     contract,
//   //                 });
//   //             } catch (e) {
//   //                 console.log(e);
//   //                 continue;
//   //             }
//   //         }
//   //         return erc721s;
//   //     },
//   //     async bundles1155(parent: TokenBundle): Promise<Array<ERC1155>> {
//   //         if (parent.bundles1155.addresses.length == 0) {
//   //             return [];
//   //         }
//   //         let erc1155s = [];
//   //         for (let x = 0; x < parent.bundles1155.addresses.length; x++) {
//   //             try {
//   //                 let contractDB = await getContractInfo(
//   //                     parent.bundles1155.addresses[x]
//   //                 );
//   //                 if (contractDB == null) continue;
//   //                 let contract = await getProviderContract(
//   //                     contractDB.address,
//   //                     contractDB.abi,
//   //                     await getProvider(contractDB.network)
//   //                 );
//   //                 erc1155s.push({
//   //                     contractDB,
//   //                     contract,
//   //                     qty: parent.bundles1155.qtys[x],
//   //                     id: parent.bundles1155.ids[x],
//   //                 });
//   //             } catch (e) {
//   //                 console.log(e);
//   //                 continue;
//   //             }
//   //         }
//   //         return erc1155s;
//   //     },
// }
