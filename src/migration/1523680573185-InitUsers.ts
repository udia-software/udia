import { MigrationInterface, QueryRunner } from "typeorm";

export class InitUsers1523680573185 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user_email" (
            "email" character varying(255) NOT NULL,
            "lEmail" character varying(255) NOT NULL,
            "primary" boolean NOT NULL DEFAULT false,
            "verified" boolean NOT NULL DEFAULT false,
            "verificationHash" character varying(255),
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "userUuid" uuid,
            PRIMARY KEY("lEmail")
        )`
    );
    await queryRunner.query(
      `CREATE TABLE "user" (
          "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "username" character varying(24) NOT NULL,
          "lUsername" character varying(24) NOT NULL,
          "pwHash" character varying(512) NOT NULL,
          "pwFunc" character varying(255) NOT NULL DEFAULT 'pbkdf2',
          "pwDigest" character varying(255) NOT NULL DEFAULT 'sha512',
          "pwCost" integer NOT NULL DEFAULT 5000,
          "pwKeySize" integer NOT NULL DEFAULT 768,
          "pwSalt" character varying(512) NOT NULL DEFAULT '',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          PRIMARY KEY("uuid")
        )`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ind_f442661bf68121d79f1c50cd3e" ON
      "user_email"("email")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ind_f1e21ff139bbf489e5d3bc6e3e" ON
      "user_email"("lEmail")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ind_300353b186d0848c390a64e70f" ON
      "user"("username")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ind_98ec79b9a4f076c5aa757074da" ON
      "user"("lUsername")`
    );
    await queryRunner.query(
      `ALTER TABLE "user_email" ADD CONSTRAINT "fk_53fc4e739c21b776e0c553010c1"
      FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_email" DROP CONSTRAINT
      "fk_53fc4e739c21b776e0c553010c1"`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "ind_98ec79b9a4f076c5aa757074da" ON
      -- "user"("lUsername")`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "ind_300353b186d0848c390a64e70f" ON
      -- "user"("username")`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "ind_f1e21ff139bbf489e5d3bc6e3e" ON
      -- "user_email"("lEmail")`
    );
    await queryRunner.query(
      `-- TODO: revert CREATE UNIQUE INDEX "ind_f442661bf68121d79f1c50cd3e" ON
      -- "user_email"("email")`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "user_email"`);
  }
}
