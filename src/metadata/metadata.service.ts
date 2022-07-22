import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pinataSDK, { PinataClient } from '@pinata/sdk';
import axios from 'axios';
import { RewardMetadata } from 'src/graphql.schema';

const IPFSGatewayTools = require('@pinata/ipfs-gateway-tools/dist/node');
const gatewayTools = new IPFSGatewayTools();

@Injectable()
export class MetadataService {
  pinata: PinataClient;
  gateway: string;

  constructor(private configService: ConfigService) {
    let config = this.configService.get('PINATA');
    this.pinata = pinataSDK(config.key, config.secret);
    this.gateway = config.gateway;
  }

  /**
   * @param uri will be of the form: ipfs://cid/id.json
   * @returns data from uri
   */
  async readFromIPFS(uri: string): Promise<RewardMetadata> {
    const logger = new Logger(this.readFromIPFS.name);
    try {
      const convertedGatewayUrl = await this.changeToGateway(uri);
      let res = await axios.get(convertedGatewayUrl);
      const imageUri = await this.changeToGateway(res.data.image);
      res.data.image = imageUri;
      return res.data;
    } catch (e) {
      logger.warn(e);
      return null;
    }
  }

  /**
   * convert uri to use our gateway, ex:
   * ipfs://QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json becomes
   * https://matrix.mypinata.cloud/ipfs/QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json
   * @param uri uri to convert
   * @returns convert uri or null if it doesnt contain the cid
   */
  async changeToGateway(uri: string): Promise<string | null> {
    const cidInfo = gatewayTools.containsCID(uri);
    if (cidInfo.containsCid) {
      const convertedGatewayUrl = gatewayTools.convertToDesiredGateway(
        uri,
        this.gateway
      );
      return convertedGatewayUrl;
    }
    throw new Error('INVALID URI');
  }
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
