import {MigrationInterface, QueryRunner} from "typeorm";

export class true1521695369002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwCost" TYPE integer`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwCost" SET DEFAULT 5000`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" TYPE integer`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" SET DEFAULT 512`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwNonce" SET DEFAULT pwNonce`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwAuth" SET DEFAULT pwAuth`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwSalt" SET DEFAULT pwSalt`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwSalt" SET DEFAULT pwSalt`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwAuth" SET DEFAULT pwAuth`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwNonce" SET DEFAULT pwNonce`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" SET DEFAULT 512`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" TYPE integer`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwCost" SET DEFAULT 5000`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwCost" TYPE integer`);
    }

}
