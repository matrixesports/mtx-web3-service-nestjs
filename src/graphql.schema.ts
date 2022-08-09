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

export enum RedeemStatus {
    REDEEMED = "REDEEMED",
    PROCESSING = "PROCESSING",
    REJECTED = "REJECTED"
}

export enum RequiredUserSocialOptions {
    INSTAGRAM_USERNAME = "INSTAGRAM_USERNAME",
    TWITTER_USERNAME = "TWITTER_USERNAME",
    TWITCH_USERNAME = "TWITCH_USERNAME",
    CLASH_USERNAME = "CLASH_USERNAME",
    PREFERRED_SOCIAL = "PREFERRED_SOCIAL"
}

export enum RequiredUserPaymentOptions {
    CASHAPP = "CASHAPP",
    PAYPAL_EMAIL = "PAYPAL_EMAIL",
    VENMO_USERNAME = "VENMO_USERNAME"
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
    freeReward?: Nullable<Reward>;
    premiumReward?: Nullable<Reward>;
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
    rewardType?: Nullable<RewardType>;
    creatorId: number;
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
    reward: Reward;
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

export abstract class IMutation {
    abstract claimReward(creatorId: number, level: number, premium: boolean, autoRedeem: boolean): ClaimRewardResponse | Promise<ClaimRewardResponse>;

    abstract redeemReward(creatorId: number, itemId: number): MutationResponse | Promise<MutationResponse>;

    abstract craft(recipeId: number): MutationResponse | Promise<MutationResponse>;
}

export class ClaimRewardResponse {
    success: boolean;
    reward?: Nullable<Nullable<Reward>[]>;
    description?: Nullable<string>;
    missingFields?: Nullable<UserMissingFields>;
}

export class UserMissingFields {
    payment?: Nullable<Nullable<RequiredUserPaymentOptions>[]>;
    social?: Nullable<Nullable<RequiredUserSocialOptions>[]>;
}

export class MutationResponse {
    success: boolean;
    description?: Nullable<string>;
}

export type BigInt = unknown;
type Nullable<T> = T | null;
