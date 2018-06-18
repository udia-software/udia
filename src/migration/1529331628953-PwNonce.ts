import { MigrationInterface, QueryRunner } from "typeorm";

export class PwNonce1529331628953 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pwSalt" TO "pwNonce"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwNonce" IS ` +
        `'Client side derived password nonce.'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pwNonce" TO "pwSalt"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwSalt" IS ` +
        `'Client side derived password salt.'`
    );
  }
}
