import { MigrationInterface, QueryRunner } from "typeorm";

export class ItemClosure1526789468761 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "item_closure" (` +
        `"ancestor" uuid NOT NULL, ` +
        `"descendant" uuid NOT NULL, ` +
        `"depth" integer NOT NULL DEFAULT 0, ` +
        `CONSTRAINT "PK_9c9a9280691285223f1ad9b5555" ` +
        `PRIMARY KEY ("ancestor", "descendant"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9c9a9280691285223f1ad9b555" ON ` +
        `"item_closure"("ancestor", "descendant") `
    );
    await queryRunner.query(
      `ALTER TABLE "item_closure" ADD CONSTRAINT "FK_3e6a5639e2695ce8b5564f3f5fe" ` +
        `FOREIGN KEY ("ancestor") REFERENCES "item"("uuid")`
    );
    await queryRunner.query(
      `ALTER TABLE "item_closure" ADD CONSTRAINT "FK_edb78b7860fe58f92332fd1bbc7" ` +
        `FOREIGN KEY ("descendant") REFERENCES "item"("uuid")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "item_closure" DROP CONSTRAINT "FK_edb78b7860fe58f92332fd1bbc7"`
    );
    await queryRunner.query(
      `ALTER TABLE "item_closure" DROP CONSTRAINT "FK_3e6a5639e2695ce8b5564f3f5fe"`
    );
    await queryRunner.query(`DROP INDEX "IDX_9c9a9280691285223f1ad9b555"`);
    await queryRunner.query(`DROP TABLE "item_closure"`);
  }
}
