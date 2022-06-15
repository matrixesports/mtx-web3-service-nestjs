import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pinataSDK, { PinataClient } from '@pinata/sdk';

@Injectable()
export class IpfsService {
  IPFSGatewayTools = require('@pinata/ipfs-gateway-tools/dist/node');
  gatewayTools = new this.IPFSGatewayTools();
  pinata: PinataClient;

  constructor(private configService: ConfigService) {
    this.pinata = pinataSDK(
      this.configService.get('PINATA_API_KEY'),
      this.configService.get('PINATA_API_SECRET'),
    );
  }

  /**
   *
   * REQUIREMENTS:
   * When uploading metadata URI, do not use our gateway as its just going to increase our usage,but when its us using it, then convert it to our gateway
   * deploy with 'ipfs://cid'
   * uri in contracts will take care of appending /id.json
   * @param source fs path, process.cwd()+path
   * @param name name of folder, for easy lookups
   * @param metadata an object with key val pairs to indicate any metadata associated with the folder
   * @returns cid of folder pinned to pinata
   */
  async pinToIPFS(source: string, name: string, metadata: any) {
    let res = null;
    try {
      res = await this.pinata.pinFromFS(source, {
        pinataMetadata: {
          name: name,
          keyvalues: metadata,
        },
        pinataOptions: {
          cidVersion: 0,
        },
      });
    } catch (e) {
      console.log(e);
      return res;
    }
    return res.IpfsHash;
  }

  /**
   * @param uri will be of the form: ipfs://cid/id.json
   * @returns data from uri
   */

  async readFromIPFS(uri: string) {
    let convertedGatewayUrl = await this.changeToGateway(uri);
    if (convertedGatewayUrl == null) {
      console.log(
        'Cannot convert uri to gateway url coz it doesnt have cid',
        uri,
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
    let imageUri = await this.changeToGateway(res.data.image);
    if (imageUri != null) {
      res.data.image = imageUri;
    }
    return res.data;
  }

  //convert uri to use our gateway, ex:
  // ipfs://QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json becomes
  // https://matrix.mypinata.cloud/ipfs/QmWwjrXyFBY3WSRuMmxsV6CLtttLi73JrfMnBGYsDa1FE5/1.json
  async changeToGateway(uri: string): Promise<string | null> {
    let cidInfo = this.gatewayTools.containsCID(uri);
    if (cidInfo.containsCid) {
      let convertedGatewayUrl = this.gatewayTools.convertToDesiredGateway(
        uri,
        this.configService.get('PINATA_GATEWAY'),
      );
      return convertedGatewayUrl;
    }
    return null;
  }

  // /**
  //  * helper methods when u dont have the id but just want the metadata associated with a folder
  //  * @param uri will be of the form: ipfs://cid/id.json
  //  */
  // export async function getFolderMetadata(uri: string) {
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
