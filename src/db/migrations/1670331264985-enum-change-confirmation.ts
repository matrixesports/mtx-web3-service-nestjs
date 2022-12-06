import { MigrationInterface, QueryRunner } from 'typeorm';

export class enumChangeConfirmation1670331264985 implements MigrationInterface {
  name = 'enumChangeConfirmation1670331264985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_reward_type_enum" AS ENUM('PREMIUM_PASS', 'CREATOR_TOKEN', 'LOOTBOX', 'REDEEMABLE', 'SPECIAL', 'GIVEAWAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metadata" ALTER COLUMN "reward_type" TYPE "public"."metadata_reward_type_enum" USING "reward_type"::"text"::"public"."metadata_reward_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "reward_type" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE TYPE "public"."rewardtype_old" AS ENUM('PREMIUM_PASS', 'CREATOR_TOKEN', 'LOOTBOX', 'REDEEMABLE', 'SPECIAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metadata" ALTER COLUMN "reward_type" TYPE "public"."rewardtype_old" USING "reward_type"::"text"::"public"."rewardtype_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."metadata_reward_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."rewardtype_old" RENAME TO "rewardtype"`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "image"`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "image" text`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "name" text`);
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "required_user_payment_options"`);
    await queryRunner.query(`DROP TYPE "public"."battlepass_required_user_payment_options_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."requireduserpaymentoptions" AS ENUM('CASHAPP', 'PAYPAL_EMAIL', 'VENMO_USERNAME')`,
    );
    await queryRunner.query(
      `ALTER TABLE "battlepass" ADD "required_user_payment_options" "public"."requireduserpaymentoptions" array`,
    );
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "required_user_social_options"`);
    await queryRunner.query(`DROP TYPE "public"."battlepass_required_user_social_options_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."requiredusersocialoptions" AS ENUM('INSTAGRAM_USERNAME', 'TWITTER_USERNAME', 'TWITCH_USERNAME', 'CLASH_USERNAME', 'PREFERRED_SOCIAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "battlepass" ADD "required_user_social_options" "public"."requiredusersocialoptions" array`,
    );
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "end_date"`);
    await queryRunner.query(`ALTER TABLE "battlepass" ADD "end_date" date`);
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "battlepass" ADD "currency" text`);
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "price"`);
    await queryRunner.query(`ALTER TABLE "battlepass" ADD "price" text`);
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "battlepass" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "battlepass" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "battlepass" ADD "name" text`);
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_address_check" CHECK (((user_address)::text ~* '^^0x[a-fA-F0-9]{40}$'::text))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "inventory_creator_id_check" CHECK ((creator_id > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "inventory_balance_check" CHECK ((balance > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "inventory_asset_check" CHECK ((asset > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe" ADD CONSTRAINT "recipe_creator_id_check" CHECK ((creator_id > 0))`,
    );
  }
}
