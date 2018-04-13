import { MigrationInterface, QueryRunner } from "typeorm";

export class InitUser1523594224495 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user_email" (
          "email" character varying(255) NOT NULL,
          "primary" boolean NOT NULL DEFAULT false,
          "verified" boolean NOT NULL DEFAULT false,
          "verificationHash" character varying(255),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "userUuid" uuid,
          PRIMARY KEY("email"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user" (
          "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "username" character varying(24) NOT NULL,
          "pwHash" character varying(512) NOT NULL,
          "pwFunc" character varying(255) NOT NULL DEFAULT 'pbkdf2',
          "pwDigest" character varying(255) NOT NULL DEFAULT 'sha512',
          "pwCost" integer NOT NULL DEFAULT 5000,
          "pwKeySize" integer NOT NULL DEFAULT 768,
          "pwSalt" character varying(512) NOT NULL DEFAULT '',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          PRIMARY KEY("uuid"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_lower_email"
      ON "user_email"(LOWER("email"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_lower_username"
      ON "user"(LOWER("username"))`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email"
      ADD CONSTRAINT "user_email_to_user"
      FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_email" DROP CONSTRAINT "user_email_to_user"`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "unique_lower_username" ON "user"("username")`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "unique_lower_email" ON "user_email"("email")`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "user_email"`);
  }
}
