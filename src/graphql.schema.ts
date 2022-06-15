
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export class ContractDb {
    address: string;
    network: string;
    creator_id: number;
    ctr_type: string;
}

export abstract class IQuery {
    abstract getRecipe(creatorId: number, recipeId: number): Nullable<Recipe> | Promise<Nullable<Recipe>>;
}

export class Recipe {
    inputIngredients?: Nullable<string>;
    outputIngredients?: Nullable<string>;
}

type Nullable<T> = T | null;
