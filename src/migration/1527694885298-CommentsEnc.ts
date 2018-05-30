import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Added comments for all fields, added columns for encryption keys
 */
export class CommentsEnc1527694885298 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" ADD "pubSignKey" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "encPrivSignKey" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "encSecretKey" character varying`
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "pubEncKey" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "encPrivEncKey" character varying`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwFunc" IS ` +
        `'Client side password derivation function.'`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pwFunc" SET DEFAULT 'PBKDF2'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwDigest" IS ` +
        `'Client side password derivation digest.'`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pwDigest" SET DEFAULT 'SHA-512'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwCost" IS ` +
        `'Client side password derivation cost or iterations.'`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pwCost" SET DEFAULT 100000`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."username" IS 'Public facing username.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."lUsername" IS ` +
        `'Lower case username. Used for internal uniqueness.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pubSignKey" IS ` +
        `'Unencrypted jwk-pub signing key for verification.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."encPrivSignKey" IS ` +
        `'Encrypted private jwk-priv signing key for verification.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."encSecretKey" IS ` +
        `'Encrypted symmetric jwk-key for user secrets.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pubEncKey" IS ` +
        `'Unencrypted asymetric jwk-pub encryption key for P2P.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."encPrivEncKey" IS ` +
        `'Encrypted asymetric jwk-priv encryption key for P2P.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwHash" IS ` +
        `'Server side storage of password hash used for Auth and JWT.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwKeySize" IS ` +
        `'Client side derived password key size in bytes.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pwSalt" IS ` +
        `'Client side derived password salt.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."forgotPwHash" IS ` +
        `'If user forgot password, set temporary token hash.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."forgotPwExpiry" IS ` +
        `'If user forgot password, hash valid until.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."createdAt" IS 'User creation timestamp.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."updatedAt" IS 'User updated timestamp.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."email" IS 'User provided email.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."lEmail" IS ` +
        `'Lower case email. Used for internal uniqueness and primary key.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."primary" IS ` +
        `'Is the user email their primary email?'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."verified" IS ` +
        `'Is the user email verified?'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."verificationHash" IS ` +
        `'Server stored hash of client sent verification code.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."verificationExpiry" IS ` +
        `'When the verification hash is valid until.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."createdAt" IS ` +
        `'User email creation timestamp.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."updatedAt" IS ` +
        `'User email last updated timestamp.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item"."content" IS ` +
        `'JSON string encoded structure of the note, may be encrypted.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item"."contentType" IS ` +
        `'Type of the structure contained in the content field.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item"."encItemKey" IS ` +
        `'Client encrypted jwt-key encryption key for this item.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item"."deleted" IS 'Has the item has been deleted?'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item"."createdAt" IS 'Item creation timestamp.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item"."updatedAt" IS 'Item updated timestamp.'`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "item_closure"."depth" IS ` +
        `'Depth of relation between descendant and ancestor.'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`COMMENT ON COLUMN "item_closure"."depth" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "item"."updatedAt" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "item"."createdAt" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "item"."deleted" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "item"."encItemKey" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "item"."contentType" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "item"."content" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."updatedAt" IS NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."createdAt" IS NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."verificationExpiry" IS NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."verificationHash" IS NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_email"."verified" IS NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user_email"."primary" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user_email"."lEmail" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user_email"."email" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."updatedAt" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."createdAt" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."forgotPwExpiry" IS NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."forgotPwHash" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."pwSalt" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."pwKeySize" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."pwHash" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."encPrivEncKey" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."pubEncKey" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."encSecretKey" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."encPrivSignKey" IS NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."pubSignKey" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."lUsername" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user"."username" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pwCost" SET DEFAULT 5000`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."pwCost" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pwDigest" SET DEFAULT 'sha512'`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."pwDigest" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pwFunc" SET DEFAULT 'pbkdf2'`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."pwFunc" IS NULL`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "encPrivEncKey"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "pubEncKey"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "encSecretKey"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "encPrivSignKey"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "pubSignKey"`);
  }
}
