import { MigrationInterface, QueryRunner } from "typeorm";
// tslint:disable-next-line class-name
export class true1521694595560 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "public"."user" DROP CONSTRAINT "uk_user_email"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "pwCost" TYPE integer`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "pwCost" SET DEFAULT 5000`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" TYPE integer`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" SET DEFAULT 512`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ind_e4509f5b8531008cf7bd7ec32e" ON "public"."user"("email")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "ind_e4509f5b8531008cf7bd7ec32e" ON "public"."user"("email")`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" DROP NOT NULL`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" SET DEFAULT 512`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" TYPE integer`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwCost" SET DEFAULT 5000`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwCost" TYPE integer`
    );
    await queryRunner.query(
      `-- TODO: revert ALTER TABLE "public"."user" DROP CONSTRAINT "uk_user_email"`
    );
  }
}
