
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
    ctr_type: string;
}

export class ERC1155 {
    id?: Nullable<BigInt>;
    qty?: Nullable<BigInt>;
    contractDB: ContractDB;
    metadata?: Nullable<TokenMetadata>;
}

export class ERC20 {
    name: string;
    symbol: string;
    decimals: BigInt;
    qty: BigInt;
    contractDB: ContractDB;
}

export class ERC721 {
    name: string;
    symbol: string;
    id: BigInt;
    contractDB: ContractDB;
    metadata?: Nullable<TokenMetadata>;
}

export abstract class IQuery {
    abstract getInventory(): Nullable<Inventory> | Promise<Nullable<Inventory>>;

    abstract getLootboxOptions(lootboxAddress: string, lootboxId: number): Nullable<TokenBundle[]> | Promise<Nullable<TokenBundle[]>>;

    abstract getPass(creatorId: number): Nullable<Pass> | Promise<Nullable<Pass>>;

    abstract getRecipes(creatorId: number): Nullable<Recipe>[] | Promise<Nullable<Recipe>[]>;

    abstract getRecipe(creatorId: number, recipeId: number): Nullable<Recipe> | Promise<Nullable<Recipe>>;
}

export class Inventory {
    erc20Rewards: Nullable<ERC20>[];
    erc721Rewards: Nullable<ERC721>[];
    erc1155Rewards: Nullable<ERC1155>[];
    redeemable?: Nullable<Redeemable>;
    lootbox: Nullable<ERC1155>[];
}

export class TokenMetadata {
    name?: Nullable<string>;
    description?: Nullable<string>;
    image?: Nullable<string>;
}

export class Pass {
    token: ERC1155;
    userInfo: PassUser;
    state: PassState;
}

export class PremiumPassUser {
    owned: BigInt;
    unclaimedPremiumRewards: Nullable<PassReward>[];
}

export class PassReward {
    level: number;
    bundle: TokenBundle;
}

export class PassState {
    xp: Nullable<BigInt>[];
    maxLevel: BigInt;
    freeRewards: Nullable<PassReward>[];
    premiumRewards: Nullable<PassReward>[];
}

export class PassUser {
    xp: BigInt;
    level: BigInt;
    unclaimedFreeRewards: Nullable<PassReward>[];
    premium?: Nullable<PremiumPassUser>;
}

export class Recipe {
    inputIngredients?: Nullable<string>;
    outputIngredients?: Nullable<string>;
}

export class Redeemable {
    unredeemed: Nullable<ERC1155>[];
    redeemed: Nullable<Redeemed>[];
}

export class Redeemed {
    status: Nullable<string>[];
    token: ERC1155;
}

export class TokenBundle {
    qty: BigInt;
    erc20s: Nullable<ERC20>[];
    erc721s: Nullable<ERC721>[];
    erc1155s: Nullable<ERC1155>[];
}

export type BigInt = unknown;
type Nullable<T> = T | null;
