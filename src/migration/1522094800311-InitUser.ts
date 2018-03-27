import { MigrationInterface, QueryRunner } from "typeorm";

export class InitUser1522094800311 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user" (
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(24) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(512) NOT NULL,
        "pwFunc" character varying(255) NOT NULL DEFAULT 'pbkdf2',
        "pwDigest" character varying(255) NOT NULL DEFAULT 'sha512',
        "pwCost" integer NOT NULL DEFAULT 5000,
        "pwSalt" character varying(512) NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("uuid"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_lower_username" ON "user"(LOWER("username"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_lower_email" ON "user"(LOWER("email"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "unique_lower_email" ON "user"("email")`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "unique_lower_username" ON "user"("username")`
    );
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
