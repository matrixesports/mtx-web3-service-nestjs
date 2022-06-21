// // //dev script

// import axios from 'axios';
// import { ethers } from 'ethers';
// import { Contract } from 'src/contract/contract.entity';

// async function

// async function addtodb() {
//   let ctr = new Contract();
//   ctr.address = '';
//   ctr.creator_id = 1;
//   ctr.ctr_type = 'Lootbox';
//   ctr.name = 'Lootbox';
//   ctr.network = 'matic';

//   let compiledCtr = await getCompiledCtr(addContractDto.name);
//   ctr.abi = compiledCtr.abi;

//   const queryRunner = this.dataSource.createQueryRunner();
//   await queryRunner.connect();
//   await queryRunner.startTransaction();
//   try {
//     await queryRunner.manager.save(ctr);
//     await queryRunner.commitTransaction();
//   } catch (err) {
//     console.log(err);
//     // since we have errors lets rollback the changes we made
//     await queryRunner.rollbackTransaction();
//     await queryRunner.release();
//     throw new Error('Could not add to DB');
//   }
//   await queryRunner.release();
// }

// async function deploy() {
//   let factory = await getFactory();
//   let fee;
//   if (deployContractDto.network == 'matic') {
//     fee = await this.getMaticFeeData();
//   }
//   let ctr: ethers.Contract;
//   try {
//     if (deployContractDto.args == undefined) {
//       ctr = await factory.deploy(fee);
//     } else {
//       ctr = await factory.deploy(...deployContractDto.args, fee);
//     }

//     await this.waitForTx(ctr.deployTransaction.hash, deployContractDto.network);
//   } catch (e) {
//     throw new Error(`Cannot deploy ctr ${deployContractDto} ${e}`);
//   }
//   console.log('DEPLOYED:', deployContractDto);
//   return ctr.address;
// }

// //will throw error
// async function getFactory(
//   deployContractDto: DeployContractDto,
// ): Promise<ethers.ContractFactory> {
//   let signer = this.getSigner(deployContractDto.network);
//   let compiledCtr = await this.getCompiledCtr(deployContractDto.name);
//   try {
//     if (
//       deployContractDto.ctr_type == 'Lootbox' ||
//       deployContractDto.ctr_type == 'Pass' ||
//       deployContractDto.ctr_type == 'Workshop'
//     ) {
//       let distributor: Contract = await this.findOneBy({
//         ctr_type: 'Distributor',
//         network: deployContractDto.network,
//       });
//       let linkedBytecode = this.linkLibraries(
//         compiledCtr.bytecode.object,
//         compiledCtr.bytecode.linkReferences,
//         distributor.address,
//       );
//       return new ContractFactory(compiledCtr.abi, linkedBytecode, signer);
//     } else {
//       return new ContractFactory(compiledCtr.abi, compiledCtr.bytecode, signer);
//     }
//   } catch (e) {
//     throw new Error(
//       `cannot get compiled contract for ${deployContractDto.name}`,
//     );
//   }
// }

// function linkLibraries(
//   bytecode: any,
//   linkReferences: any,
//   libAddy: any,
// ): string {
//   Object.keys(linkReferences).forEach((fileName) => {
//     Object.keys(linkReferences[fileName]).forEach((contractName) => {
//       const address = libAddy.toLowerCase().slice(2);
//       linkReferences[fileName][contractName].forEach(
//         ({ start: byteStart, length: byteLength }: any) => {
//           const start = 2 + byteStart * 2;
//           const length = byteLength * 2;
//           bytecode = bytecode
//             .slice(0, start)
//             .concat(address)
//             .concat(bytecode.slice(start + length, bytecode.length));
//         },
//       );
//     });
//   });
//   return bytecode;
// }

// async function waitForTx(hash: string, network: string) {
//   let provider = getProvider(network);
//   await provider.waitForTransaction(hash, this.NUMBER_OF_BLOCKS_TO_WAIT);
// }

// async function getCompiledCtr(name: string) {
//   let res = await import(process.cwd() + `/out/${name}.sol/${name}.json`);
//   return res;
// }
// //   IPFSGatewayTools = require('@pinata/ipfs-gateway-tools/dist/node');
// //   gatewayTools = new this.IPFSGatewayTools();
// //   pinata: PinataClient;
// //   constructor(private configService: ConfigService) {
// //     this.pinata = pinataSDK(
// //       this.configService.get('PINATA_API_KEY'),
// //       this.configService.get('PINATA_API_SECRET'),
// //     );
// //   }
//   /**
//    *
//    * REQUIREMENTS:
//    * When uploading metadata URI, do not use our gateway as its just going to increase our usage,but when its us using it, then convert it to our gateway
//    * deploy with 'ipfs://cid'
//    * uri in contracts will take care of appending /id.json
//    * @param source fs path, process.cwd()+path
//    * @param name name of folder, for easy lookups
//    * @param metadata an object with key val pairs to indicate any metadata associated with the folder
//    * @returns cid of folder pinned to pinata
//    */
//   async pinToIPFS(source: string, name: string, metadata: any) {
//     let res = null;
//     try {
//       res = await this.pinata.pinFromFS(source, {
//         pinataMetadata: {
//           name: name,
//           keyvalues: metadata,
//         },
//         pinataOptions: {
//           cidVersion: 0,
//         },
//       });
//     } catch (e) {
//       console.log(e);
//       return res;
//     }
//     return res.IpfsHash;
//   }
//   /**
//    * @param uri will be of the form: ipfs://cid/id.json
//    * @returns data from uri
//    */
//   async readFromIPFS(uri: string) {
//     let convertedGatewayUrl = await this.changeToGateway(uri);
//     if (convertedGatewayUrl == null) {
//       console.log(
//         'Cannot convert uri to gateway url coz it doesnt have cid',
//         uri,
//       );
//       return null;
//     }
//     let res;
//     try {
//       res = await axios.get(convertedGatewayUrl);
//     } catch (e) {
//       console.log(`Cannot get ipfs info from ${convertedGatewayUrl}`);
//       return null;
//     }
//     //convert image for our gateway
//     let imageUri = await this.changeToGateway(res.data.image);
//     if (imageUri != null) {
//       res.data.image = imageUri;
//     }
//     return res.data;
//   }
//   //convert uri to use our gateway, ex:
//   // ipfs://QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json becomes
//   // https://matrix.mypinata.cloud/ipfs/QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json
//   async changeToGateway(uri: string): Promise<string | null> {
//     let cidInfo = this.gatewayTools.containsCID(uri);
//     if (cidInfo.containsCid) {
//       let convertedGatewayUrl = this.gatewayTools.convertToDesiredGateway(
//         uri,
//         this.configService.get('PINATA_GATEWAY'),
//       );
//       return convertedGatewayUrl;
//     }
//     return null;
//   }
//   // /**
//   //  * helper methods when u dont have the id but just want the metadata associated with a folder
//   //  * @param uri will be of the form: ipfs://cid/id.json
//   //  */
//   // export async function getFolderMetadata(uri: string) {
//   //     let res = gatewayTools.containsCID(uri);
//   //     let cid;
//   //     if (res.containsCid) {
//   //         cid = res.cid;
//   //     } else {
//   //         console.log("INVALID URI", uri);
//   //         return null;
//   //     }
//   //     let pins = await pinata.pinList({
//   //         hashContains: cid,
//   //     });
//   //     return pins.rows[0].metadata;
// //   // }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });
