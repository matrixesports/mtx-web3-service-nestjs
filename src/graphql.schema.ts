/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export class ContractDB {
  address: string;
  network: string;
  creator_id: number;
}

export class ERC1155 {
  id?: Nullable<BigInt>;
  qty?: Nullable<BigInt>;
  contractDB: ContractDB;
  metadata?: Nullable<TokenMetadata>;
}

export class TokenMetadata {
  name?: Nullable<string>;
  description?: Nullable<string>;
  image?: Nullable<string>;
}

export abstract class IQuery {
  abstract getPass(creatorId: number): Nullable<Pass> | Promise<Nullable<Pass>>;
}

export class Pass {
  token: ERC1155;
  state: PassState;
  userInfo: PassUser;
}

export class PassState {
  xp: Nullable<BigInt>[];
  maxLevel: BigInt;
  freeRewards: Nullable<PassReward>[];
  premiumRewards: Nullable<PassReward>[];
}

export class PremiumUser {
  owned: BigInt;
  unclaimedPremiumRewards: Nullable<PassReward>[];
}

export class PassReward {
  level: number;
  reward: ERC1155;
}

export class PassUser {
  xp: BigInt;
  level: BigInt;
  unclaimedFreeRewards: Nullable<PassReward>[];
  premium?: Nullable<PremiumUser>;
}

export type BigInt = unknown;
type Nullable<T> = T | null;
