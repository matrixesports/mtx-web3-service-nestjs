
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export class BattlePass {
    name: string;
    description: string;
    price: string;
    currency: string;
    endDate: Date;
    seasonId: BigInt;
    maxLevel: BigInt;
    levelInfo: Nullable<LevelInfo>[];
    userInfo?: Nullable<BattlePassUser>;
}

export class LevelInfo {
    level: number;
    xpToCompleteLevel: BigInt;
    freeReward: Reward;
    premiumReward: Reward;
}

export class BattlePassUser {
    xp: BigInt;
    level: BigInt;
    unclaimedFreeRewards: Nullable<number>[];
    premium?: Nullable<PremiumBattlePassUser>;
}

export class PremiumBattlePassUser {
    owned: BigInt;
    unclaimedPremiumRewards: Nullable<number>[];
}

export class Reward {
    id: BigInt;
    qty: BigInt;
    metadata?: Nullable<RewardMetadata>;
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
