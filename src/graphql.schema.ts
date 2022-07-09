
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum RedeemStatus {
    REDEEMED = "REDEEMED",
    PROCESSING = "PROCESSING",
    REJECTED = "REJECTED"
}

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
    id?: Nullable<BigInt>;
    qty: BigInt;
    metadata?: Nullable<RewardMetadata>;
}

export class RewardMetadata {
    name: string;
    description: string;
    image: string;
}

export class Recipe {
    recipeId: BigInt;
    isActive: boolean;
    inputIngredients: Nullable<Reward>[];
    outputIngredients: Nullable<Reward>[];
}

export class Inventory {
    default: Nullable<Reward>[];
    redeemed: Nullable<Redeemed>[];
}

export class Redeemed {
    id: BigInt;
    status: Nullable<RedeemStatus>[];
}

export class LootboxOption {
    probability: number;
    reward: Nullable<Reward>[];
}

export abstract class IQuery {
    abstract getBattlePass(creatorId: number): Nullable<BattlePass> | Promise<Nullable<BattlePass>>;

    abstract getInventory(): Nullable<Inventory> | Promise<Nullable<Inventory>>;

    abstract getLootboxOptions(creatorId: number, lootboxId: number): Nullable<Nullable<LootboxOption>[]> | Promise<Nullable<Nullable<LootboxOption>[]>>;

    abstract getRecipes(creatorId: number): Nullable<Nullable<Recipe>[]> | Promise<Nullable<Nullable<Recipe>[]>>;

    abstract getRecipe(creatorId: number, recipeId: number): Nullable<Recipe> | Promise<Nullable<Recipe>>;
}

export type BigInt = unknown;
type Nullable<T> = T | null;
