import { MigrationInterface, QueryRunner } from "typeorm";

// tslint:disable-next-line class-name
export class true1521688449209 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "pwFunc" character varying(255) NOT NULL DEFAULT 'pbkdf2', "pwAlg" character varying(255) NOT NULL DEFAULT 'sha512', "pwCost" integer NOT NULL DEFAULT 5000, "pwKeySize" integer NOT NULL, "pwNonce" character varying(255) NOT NULL, "pwAuth" character varying(255) NOT NULL, "pwSalt" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "uk_user_email" UNIQUE ("email"), PRIMARY KEY("uuid"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
