import { Args, Context, GqlContextType, Query, Resolver } from '@nestjs/graphql';
import { PlayerCubits, PlayerDetails } from 'src/graphql.schema';
import { MicroserviceService } from 'src/microservice/microservice.service';
import { ManacubeService } from './manacube.service';

@Resolver()
export class ManacubeResolver {
  constructor(
    private manacubeService: ManacubeService,
    private microService: MicroserviceService,
  ) {}

  @Query(() => PlayerCubits)
  async getPlayerCubits(@Context() context): Promise<PlayerCubits> {
    const userAddress = context.req.headers['user-address'];
    // get the player from the user service
    const {
      minecraft: { uuid },
    } = await this.microService.getUserDetails(userAddress);
    return await this.manacubeService.getPlayerCubitBalance(uuid);
  }

  @Query()
  async getPlayerLevel(@Context() context) {
    const userAddress = context.req.headers['user-address'];
    // get the player from the user service
    const {
      minecraft: { uuid },
    } = await this.microService.getUserDetails(userAddress);
    return await this.manacubeService.getPlayerLevel(uuid);
  }

  @Query(() => [PlayerDetails])
  async getPatronPlayers(@Context() context) {
    return await this.manacubeService.getPatronMembers();
  }
}
