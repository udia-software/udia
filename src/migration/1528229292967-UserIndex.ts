import { MigrationInterface, QueryRunner } from "typeorm";

export class UserIndex1528229292967 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE INDEX "IDX_2e613ec8058a311900c12ff8b9" ON ` +
        `"user"("createdAt", "uuid", "lUsername") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP INDEX "IDX_2e613ec8058a311900c12ff8b9"`);
  }
}
