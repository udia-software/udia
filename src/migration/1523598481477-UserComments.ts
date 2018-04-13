import {MigrationInterface, QueryRunner} from "typeorm";

export class UserComments1523598481477 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`COMMENT ON COLUMN "public"."user_email"."email" is 'User provided email.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user_email"."primary" is 'Is user email primary.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user_email"."verified" is 'Is user email verified.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user_email"."verificationHash" is 'Server stored hash of client sent verification code.'`);
        await queryRunner.query(`ALTER TABLE "public"."user_email" ALTER COLUMN "createdAt" TYPE TIMESTAMP`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user_email"."createdAt" is 'Email creation timestamp.'`);
        await queryRunner.query(`ALTER TABLE "public"."user_email" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user_email"."updatedAt" is 'Email last updated timestamp.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."username" is 'Public facing username.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."pwHash" is 'Server side storage of password hash.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."pwFunc" is 'Client side password derivation function.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."pwDigest" is 'Client side password derivation digest.'`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwCost" TYPE integer`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."pwCost" is 'Client side password derivation cost.'`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" TYPE integer`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."pwKeySize" is 'Client side derived password key size.'`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."pwSalt" is 'Client side derived password salt.'`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "createdAt" TYPE TIMESTAMP`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."createdAt" is 'User creation timestamp.'`);
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`);
        await queryRunner.query(`COMMENT ON COLUMN "public"."user"."updatedAt" is 'User updated timestamp.'`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."updatedAt" is 'User updated timestamp.'`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."createdAt" is 'User creation timestamp.'`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "createdAt" TYPE TIMESTAMP`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."pwSalt" is 'Client side derived password salt.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."pwKeySize" is 'Client side derived password key size.'`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwKeySize" TYPE integer`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."pwCost" is 'Client side password derivation cost.'`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user" ALTER COLUMN "pwCost" TYPE integer`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."pwDigest" is 'Client side password derivation digest.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."pwFunc" is 'Client side password derivation function.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."pwHash" is 'Server side storage of password hash.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user"."username" is 'Public facing username.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user_email"."updatedAt" is 'Email last updated timestamp.'`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user_email" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user_email"."createdAt" is 'Email creation timestamp.'`);
        await queryRunner.query(`-- TODO: revert ALTER TABLE "public"."user_email" ALTER COLUMN "createdAt" TYPE TIMESTAMP`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user_email"."verificationHash" is 'Server stored hash of client sent verification code.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user_email"."verified" is 'Is user email verified.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user_email"."primary" is 'Is user email primary.'`);
        await queryRunner.query(`-- TODO: revert COMMENT ON COLUMN "public"."user_email"."email" is 'User provided email.'`);
    }

}
