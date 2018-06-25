import { MigrationInterface, QueryRunner } from "typeorm";

export class KeyRename1529705781505 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pubSignKey" to "pubVerifyKey"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pubVerifyKey" IS ` +
        `'Unencrypted asymmetric jwk-pub verification key.'`
    );

    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "encPrivSignKey" to "encPrivateSignKey"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."encPrivateSignKey" IS ` +
        `'Encrypted asymmetric jwk-priv signing key.'`
    );

    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pubEncKey" to "pubEncryptKey"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pubEncryptKey" IS ` +
        `'Unencrypted asymmetric jwk-pub encryption key for P2P comm.'`
    );

    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "encPrivEncKey" to "encPrivateDecryptKey"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "encPrivateDecryptKey" to "encPrivSignKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pubEncryptKey" to "pubEncKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "encPrivateSignKey" to "encPrivSignKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pubVerifyKey" to "pubSignKey"`
    );
  }
}
