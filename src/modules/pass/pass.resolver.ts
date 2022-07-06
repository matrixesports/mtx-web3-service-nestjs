import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { ERC1155 } from 'src/graphql.schema';
import { GetPassDto } from './dto/GetPass.dto';
import { GetPassArgsDto } from './dto/GetPassArgs.dto';
import { GetPassUserInfoDto } from './dto/GetPassUserInfo.dto';
import { GetPassUserInfoArgsDto } from './dto/GetPassUserInfoArgs.dto';
import { PassService } from './pass.service';

@Resolver('Pass')
export class PassResolver {
  constructor(private passService: PassService) {}

  @Query()
  async getPass(@Args() args: GetPassArgsDto): Promise<GetPassDto> {
    const contractDB = await this.passService.getPassDB(args.creatorId);
    const contract = await this.passService.getPassCtr(contractDB);
    const seasonId = await contract.seasonId();
    return { contractDB, contract, seasonId };
  }

  @ResolveField()
  state(@Parent() parent: GetPassDto): GetPassDto {
    return parent;
  }

  @ResolveField()
  token(@Parent() parent: GetPassDto): ERC1155 {
    return { id: parent.seasonId, contractDB: parent.contractDB };
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetPassDto,
    @Args() args: GetPassUserInfoArgsDto
  ): GetPassUserInfoDto {
    return { ...parent, userAddress: args.userAddress };
  }
}
