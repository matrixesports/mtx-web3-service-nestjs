
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum RewardType {
    PREMIUM_PASS = "PREMIUM_PASS",
    CREATOR_TOKEN = "CREATOR_TOKEN",
    LOOTBOX = "LOOTBOX",
    REDEEMABLE = "REDEEMABLE",
    SPECIAL = "SPECIAL"
}

export class BattlePass {
    name: string;
    description: string;
    price: string;
    currency: string;
    endDate: Date;
    seasonId: BigInt;
    levelInfo: Nullable<LevelInfo>[];
    userInfo: BattlePassUser;
}

export class LevelInfo {
    level: BigInt;
    xpToCompleteLevel: BigInt;
    freeReward: Reward;
    premiumReward: Reward;
}

export class BattlePassUser {
    xp: BigInt;
    level: BigInt;
    unclaimedFreeRewards: Nullable<LevelInfo>[];
    premium?: Nullable<PremiumBattlePassUser>;
}

export class PremiumBattlePassUser {
    owned: BigInt;
    unclaimedPremiumRewards: Nullable<LevelInfo>[];
}

export class Reward {
    id: BigInt;
    qty: BigInt;
    rewardType: RewardType;
    metadata: RewardMetadata;
}

export class RewardMetadata {
    name: string;
    description: string;
    image: string;
}

export abstract class IQuery {
    abstract getBattlePass(creatorId: number): Nullable<BattlePass> | Promise<Nullable<BattlePass>>;
}

export type BigInt = unknown;
type Nullable<T> = T | null;
