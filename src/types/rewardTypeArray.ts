import { RewardType } from 'src/graphql.schema';

// easier this way since contract enum returns uint index
export const rewardTypeArray = Object.values(RewardType);
