import { Resolver } from '@nestjs/graphql';

@Resolver()
export class Erc1155Resolver {
  //  async metadata(parent: ERC1155): Promise<TokenMetadata | null> {
  //         if (parent.id == null) return null;
  //         let uri = await parent.contract.uri(parent.id);
  //         return await readFromIPFS(uri);
  //     },
}
