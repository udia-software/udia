import { MigrationInterface, QueryRunner } from "typeorm";

export class Item1526785097199 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "item" (` +
        `"uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"content" character varying NOT NULL, ` +
        `"contentType" citext NOT NULL, ` +
        `"encItemKey" character varying NOT NULL, ` +
        `"deleted" boolean NOT NULL DEFAULT false, ` +
        `"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"userUuid" uuid, ` +
        `CONSTRAINT "PK_eb3fcd003ddc6f23c342885677b" ` +
        `PRIMARY KEY ("uuid"))`
    );
    await queryRunner.query(
      `ALTER TABLE "item" ` +
        `ADD CONSTRAINT "FK_39284ee60d6fe972833d5c4e9ac" ` +
        `FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_39284ee60d6fe972833d5c4e9ac"`
    );
    await queryRunner.query(`DROP TABLE "item"`);
  }
}
