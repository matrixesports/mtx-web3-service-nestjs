import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pinataSDK, { PinataClient } from '@pinata/sdk';
import axios from 'axios';
import { TokenMetadata } from 'src/common/directives/web3.service.directive';
import IPFSGatewayTools from '@pinata/ipfs-gateway-tools/dist/node';

@Injectable()
export class MetadataService {
  gateway: string;
  pinata: PinataClient;
  gatewayTools;

  constructor(private configService: ConfigService) {
    this.gatewayTools = new IPFSGatewayTools();
    this.pinata = pinataSDK(
      this.configService.get('PINATA_API_KEY'),
      this.configService.get('PINATA_API_SECRET')
    );
    this.gateway = this.configService.get('PINATA_GATEWAY');
  }

  /**
   * @param uri will be of the form: ipfs://cid/id.json
   * @returns data from uri
   */
  async readFromIPFS(uri: string): Promise<TokenMetadata> {
    const convertedGatewayUrl = await this.changeToGateway(uri);
    if (convertedGatewayUrl == null) {
      console.log(
        'Cannot convert uri to gateway url coz it doesnt have cid',
        uri
      );
      return null;
    }
    let res;
    try {
      res = await axios.get(convertedGatewayUrl);
    } catch (e) {
      console.log(`Cannot get ipfs info from ${convertedGatewayUrl}`);
      return null;
    }
    //convert image for our gateway
    const imageUri = await this.changeToGateway(res.data.image);
    if (imageUri != null) {
      res.data.image = imageUri;
    }
    return res.data;
  }

  //convert uri to use our gateway, ex:
  // ipfs://QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json becomes
  // https://matrix.mypinata.cloud/ipfs/QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json
  async changeToGateway(uri: string): Promise<string | null> {
    let urii = "ipfs:/ipfs/" + uri
    const cidInfo = this.gatewayTools.containsCID(urii);
    if (cidInfo.containsCid) {
      const convertedGatewayUrl = this.gatewayTools.convertToDesiredGateway(
        urii,
        this.gateway
      );
      return convertedGatewayUrl;
    }
    return null;
  }

  // /**
  //  * helper methods when u dont have the id but just want the metadata associated with a folder
  //  * @param uri will be of the form: ipfs://cid/id.json
  //  */
  //  async function getFolderMetadata(uri: string) {
  //     let res = gatewayTools.containsCID(uri);
  //     let cid;
  //     if (res.containsCid) {
  //         cid = res.cid;
  //     } else {
  //         console.log("INVALID URI", uri);
  //         return null;
  //     }
  //     let pins = await pinata.pinList({
  //         hashContains: cid,
  //     });
  //     return pins.rows[0].metadata;
  // }
}

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
