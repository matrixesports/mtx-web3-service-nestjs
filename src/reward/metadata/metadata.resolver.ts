import { ResolveField, Resolver } from '@nestjs/graphql';

@Resolver('RewardMetadata')
export class MetadataResolver {
  @ResolveField()
  name() {
    return 'a';
  }
  @ResolveField()
  description() {
    return 'z';
  }
  @ResolveField()
  image() {
    return 'a';
  }
}
