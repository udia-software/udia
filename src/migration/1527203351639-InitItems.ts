import { MigrationInterface, QueryRunner } from "typeorm";

export class InitItems1527203351639 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "item" (` +
        `"uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"content" character varying, ` +
        `"contentType" citext, ` +
        `"encItemKey" character varying, ` +
        `"deleted" boolean NOT NULL DEFAULT false, ` +
        `"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"userUuid" uuid, ` +
        `"parentUuid" uuid, ` +
        `CONSTRAINT "PK_eb3fcd003ddc6f23c342885677b" PRIMARY KEY ("uuid"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff12c3d8bc453de869e7b8b317" ON ` +
        `"item"("createdAt", "userUuid", "uuid") `
    );
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
      `ALTER TABLE "item" ADD CONSTRAINT "FK_39284ee60d6fe972833d5c4e9ac" ` +
        `FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE SET NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_84abe19147bb8f44e71a6972b5b" ` +
        `FOREIGN KEY ("parentUuid") ` +
        `REFERENCES "item"("uuid") ON DELETE SET NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "item_closure" ADD ` +
        `CONSTRAINT "FK_3e6a5639e2695ce8b5564f3f5fe" ` +
        `FOREIGN KEY ("ancestor") ` +
        `REFERENCES "item"("uuid") ON DELETE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "item_closure" ADD ` +
        `CONSTRAINT "FK_edb78b7860fe58f92332fd1bbc7" ` +
        `FOREIGN KEY ("descendant") REFERENCES "item"("uuid") ON DELETE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "item_closure" DROP ` +
        `CONSTRAINT "FK_edb78b7860fe58f92332fd1bbc7"`
    );
    await queryRunner.query(
      `ALTER TABLE "item_closure" DROP ` +
        `CONSTRAINT "FK_3e6a5639e2695ce8b5564f3f5fe"`
    );
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_84abe19147bb8f44e71a6972b5b"`
    );
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_39284ee60d6fe972833d5c4e9ac"`
    );
    await queryRunner.query(`DROP INDEX "IDX_9c9a9280691285223f1ad9b555"`);
    await queryRunner.query(`DROP TABLE "item_closure"`);
    await queryRunner.query(`DROP INDEX "IDX_ff12c3d8bc453de869e7b8b317"`);
    await queryRunner.query(`DROP TABLE "item"`);
  }
}
