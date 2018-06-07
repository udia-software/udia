import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Added index on user for keyset pagination.
 * Reduced precision on relevant postgres timestamps to ensure compatibility
 * with JavaScript millisecond precision queries.
 */
export class UserIndex1528229292967 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE INDEX "IDX_2e613ec8058a311900c12ff8b9" ON ` +
        `"user"("createdAt", "uuid", "lUsername") `
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "createdAt" ` +
        `TYPE timestamp(3) with time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updatedAt" ` +
        `TYPE timestamp(3) with time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "item" ALTER COLUMN "createdAt" ` +
        `TYPE timestamp(3) with time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "item" ALTER COLUMN "updatedAt" ` +
        `TYPE timestamp(3) with time zone`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "item" ALTER COLUMN "updatedAt" ` +
        `TYPE timestamp with time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "item" ALTER COLUMN "createdAt" ` +
        `TYPE timestamp with time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updatedAt" ` +
        `TYPE timestamp with time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "createdAt" ` +
        `TYPE timestamp with time zone`
    );
    await queryRunner.query(`DROP INDEX "IDX_2e613ec8058a311900c12ff8b9"`);
  }
}
