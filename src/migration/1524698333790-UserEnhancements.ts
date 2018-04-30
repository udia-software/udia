import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEnhancements1524698333790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP INDEX "IDX_f930684cc74d7b3eeea8c68687"`);
    await queryRunner.query(`DROP INDEX "IDX_f2bff75d7c18f08db06f81934b"`);
    await queryRunner.query(`DROP INDEX "IDX_af74e87477556de1853a2eb8e8"`);
    await queryRunner.query(`DROP INDEX "IDX_78a916df40e02a9deb1c4b75ed"`);
    await queryRunner.query(
      `ALTER TABLE "user_email" ADD "verificationExpiry" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "forgotPwHash" character varying(512)`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "forgotPwExpiry" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" DROP CONSTRAINT "PK_f930684cc74d7b3eeea8c686873"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ALTER COLUMN "lEmail" TYPE citext`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ADD CONSTRAINT "PK_f930684cc74d7b3eeea8c686873" PRIMARY KEY ("lEmail")`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ALTER COLUMN "verificationHash" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ALTER COLUMN "verificationHash" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "lUsername" TYPE citext`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f2bff75d7c18f08db06f81934b" ON "user_email"("email") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f930684cc74d7b3eeea8c68687" ON "user_email"("lEmail") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user"("username") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af74e87477556de1853a2eb8e8" ON "user"("lUsername") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP INDEX "IDX_af74e87477556de1853a2eb8e8"`);
    await queryRunner.query(`DROP INDEX "IDX_78a916df40e02a9deb1c4b75ed"`);
    await queryRunner.query(`DROP INDEX "IDX_f930684cc74d7b3eeea8c68687"`);
    await queryRunner.query(`DROP INDEX "IDX_f2bff75d7c18f08db06f81934b"`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "lUsername" TYPE character varying(24)`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ALTER COLUMN "verificationHash" SET DEFAULT ''`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ALTER COLUMN "verificationHash" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" DROP CONSTRAINT "PK_f930684cc74d7b3eeea8c686873"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ALTER COLUMN "lEmail" TYPE character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ADD CONSTRAINT "PK_f930684cc74d7b3eeea8c686873" PRIMARY KEY ("lEmail")`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "forgotPwExpiry"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "forgotPwHash"`);
    await queryRunner.query(
      `ALTER TABLE "user_email" DROP COLUMN "verificationExpiry"`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user"("username") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af74e87477556de1853a2eb8e8" ON "user"("lUsername") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f2bff75d7c18f08db06f81934b" ON "user_email"("email") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f930684cc74d7b3eeea8c68687" ON "user_email"("lEmail") `
    );
  }
}
