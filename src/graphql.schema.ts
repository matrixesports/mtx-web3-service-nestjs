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
    SPECIAL = "SPECIAL",
    GIVEAWAY = "GIVEAWAY"
}

export enum LootdropType {
    DAILY = "DAILY",
    STREAK = "STREAK",
    NORMAL = "NORMAL"
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

export enum Requirements {
    REPUTATION = "REPUTATION",
    SEASONXP = "SEASONXP",
    ALLXP = "ALLXP",
    STREAK = "STREAK"
}

export interface Ranking {
    rank: number;
    topPercent: number;
    id: string;
    pfp?: Nullable<string>;
    name?: Nullable<string>;
    total: number;
}

export abstract class IQuery {
    abstract getBattlePass(creatorId: number): Nullable<BattlePass> | Promise<Nullable<BattlePass>>;

    abstract getInventory(): Nullable<Inventory> | Promise<Nullable<Inventory>>;

    abstract getLootboxOptions(creatorId: number, lootboxId: number): Nullable<Nullable<LootboxOption>[]> | Promise<Nullable<Nullable<LootboxOption>[]>>;

    abstract getAllRecipes(): Nullable<Nullable<Recipe>[]> | Promise<Nullable<Nullable<Recipe>[]>>;

    abstract getRecipes(creatorId: number): Nullable<Nullable<Recipe>[]> | Promise<Nullable<Nullable<Recipe>[]>>;

    abstract getRecipe(creatorId: number, recipeId: number): Nullable<Recipe> | Promise<Nullable<Recipe>>;

    abstract getSeasonXpRanking(creatorId: number, seasonId: number): Nullable<Nullable<SeasonRanking>[]> | Promise<Nullable<Nullable<SeasonRanking>[]>>;

    abstract getAllXpRanking(creatorId: number): Nullable<Nullable<AllSeasonRanking>[]> | Promise<Nullable<Nullable<AllSeasonRanking>[]>>;

    abstract getReputationRanking(creatorId: number): Nullable<ReputationRanking> | Promise<Nullable<ReputationRanking>>;

    abstract getReputationRankings(creatorId: number): Nullable<Nullable<ReputationRanking>[]> | Promise<Nullable<Nullable<ReputationRanking>[]>>;

    abstract getLootdrop(creatorId: number, lootdropId: string): Nullable<Lootdrop> | Promise<Nullable<Lootdrop>>;

    abstract getLootdrops(creatorId: number): Nullable<Nullable<Lootdrop>[]> | Promise<Nullable<Nullable<Lootdrop>[]>>;

    abstract getClaimedLootdrops(creatorId: number): Nullable<Nullable<Lootdrop>[]> | Promise<Nullable<Nullable<Lootdrop>[]>>;

    abstract getPlayerCubits(): Nullable<PlayerCubits> | Promise<Nullable<PlayerCubits>>;

    abstract getPlayerLevel(): Nullable<PlayerLevel> | Promise<Nullable<PlayerLevel>>;

    abstract getPatronPlayers(): Nullable<Nullable<PlayerDetails>[]> | Promise<Nullable<Nullable<PlayerDetails>[]>>;
}

export abstract class IMutation {
    abstract claimReward(creatorId: number, level: number, premium: boolean, autoRedeem: boolean): ClaimRewardResponse | Promise<ClaimRewardResponse>;

    abstract redeemReward(creatorId: number, itemId: number): MutationResponse | Promise<MutationResponse>;

    abstract craft(recipeId: number): MutationResponse | Promise<MutationResponse>;

    abstract claimLootdrop(creatorId: number, contact: string, lootdropId: string): MutationResponse | Promise<MutationResponse>;
}

export class ClaimRewardResponse {
    success: boolean;
    reward?: Nullable<Nullable<Reward>[]>;
    description?: Nullable<string>;
    missingFields?: Nullable<UserMissingFields>;
}

export class MutationResponse {
    success: boolean;
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
    id: BigInt;
    qty: BigInt;
    metadata: RewardMetadata;
    rewardType: RewardType;
    creatorId: number;
}

export class RewardMetadata {
    name: string;
    description: string;
    image: string;
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

export class Recipe {
    recipeId: BigInt;
    isActive: boolean;
    inputIngredients: Nullable<Reward>[];
    outputIngredients: Nullable<Reward>[];
    owner: Owner;
}

export class Owner {
    creatorId: number;
    name: string;
    pfp?: Nullable<string>;
    slug?: Nullable<string>;
}

export class UserMissingFields {
    payment?: Nullable<Nullable<RequiredUserPaymentOptions>[]>;
    social?: Nullable<Nullable<RequiredUserSocialOptions>[]>;
}

export class SeasonRanking implements Ranking {
    rank: number;
    topPercent: number;
    id: string;
    pfp?: Nullable<string>;
    name?: Nullable<string>;
    total: number;
}

export class AllSeasonRanking implements Ranking {
    rank: number;
    topPercent: number;
    id: string;
    pfp?: Nullable<string>;
    name?: Nullable<string>;
    total: number;
}

export class ReputationRanking implements Ranking {
    rank: number;
    topPercent: number;
    id: string;
    pfp?: Nullable<string>;
    name?: Nullable<string>;
    total: number;
}

export class Lootdrop {
    lootdropId?: Nullable<string>;
    lootdropType: LootdropType;
    active: boolean;
    reward: Reward;
    requirements: Requirements;
    threshold: number;
    start: Date;
    end: Date;
    url: string;
}

export class PlayerDetails {
    uuid: string;
    name: string;
}

export class PlayerCubits {
    uuid: string;
    balance: number;
}

export class LevelStat {
    key: string;
    value: number;
    progression: number;
}

export class PlayerLevel {
    uuid: string;
    totalExp: number;
    stats?: Nullable<Nullable<LevelStat>[]>;
}

export type BigInt = unknown;
type Nullable<T> = T | null;
