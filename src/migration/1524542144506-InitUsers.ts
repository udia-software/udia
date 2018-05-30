import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initialized all user related entities
 */
export class InitUsers1524542144506 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user_email" (` +
        `"email" character varying(255) NOT NULL, ` +
        `"lEmail" character varying(255) NOT NULL, ` +
        `"primary" boolean NOT NULL DEFAULT false, ` +
        `"verified" boolean NOT NULL DEFAULT false, ` +
        `"verificationHash" character varying(255) NOT NULL DEFAULT '', ` +
        `"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"userUuid" uuid, ` +
        `CONSTRAINT "PK_f930684cc74d7b3eeea8c686873" PRIMARY KEY ("lEmail"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f2bff75d7c18f08db06f81934b" ON ` +
        `"user_email"("email") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f930684cc74d7b3eeea8c68687" ON ` +
        `"user_email"("lEmail") `
    );
    await queryRunner.query(
      `CREATE TABLE "user" (` +
        `"uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"username" character varying(24) NOT NULL, ` +
        `"lUsername" character varying(24) NOT NULL, ` +
        `"pwHash" character varying(512) NOT NULL, ` +
        `"pwFunc" character varying(255) NOT NULL DEFAULT 'pbkdf2', ` +
        `"pwDigest" character varying(255) NOT NULL DEFAULT 'sha512', ` +
        `"pwCost" integer NOT NULL DEFAULT 5000, ` +
        `"pwKeySize" integer NOT NULL DEFAULT 768, ` +
        `"pwSalt" character varying(512) NOT NULL DEFAULT '', ` +
        `"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `CONSTRAINT "PK_a95e949168be7b7ece1a2382fed" PRIMARY KEY ("uuid"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON ` +
        `"user"("username") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af74e87477556de1853a2eb8e8" ON ` +
        `"user"("lUsername") `
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ` +
        `ADD CONSTRAINT "FK_bc909352f2f15b2f065fce1064b" ` +
        `FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_email" DROP ` +
        `CONSTRAINT "FK_bc909352f2f15b2f065fce1064b"`
    );
    await queryRunner.query(`DROP INDEX "IDX_af74e87477556de1853a2eb8e8"`);
    await queryRunner.query(`DROP INDEX "IDX_78a916df40e02a9deb1c4b75ed"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP INDEX "IDX_f930684cc74d7b3eeea8c68687"`);
    await queryRunner.query(`DROP INDEX "IDX_f2bff75d7c18f08db06f81934b"`);
    await queryRunner.query(`DROP TABLE "user_email"`);
  }
}
