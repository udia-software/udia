import {MigrationInterface, QueryRunner} from "typeorm";

export class InitUser1521931255801 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(24) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(512) NOT NULL, "pwFunc" character varying(255) NOT NULL DEFAULT 'pbkdf2', "pwAlg" character varying(255) NOT NULL DEFAULT 'sha512', "pwCost" integer NOT NULL DEFAULT 5000, "pwKeySize" integer NOT NULL DEFAULT 512, "pwNonce" character varying(255) NOT NULL DEFAULT '', "pwAuth" character varying(255) NOT NULL DEFAULT '', "pwSalt" character varying(255) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY("uuid"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ind_300353b186d0848c390a64e70f" ON "user"(LOWER("username"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ind_e4509f5b8531008cf7bd7ec32e" ON "user"(LOWER("email"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`-- TODO: revert CREATE UNIQUE INDEX "ind_e4509f5b8531008cf7bd7ec32e" ON "user"("email")`);
        await queryRunner.query(`-- TODO: revert CREATE UNIQUE INDEX "ind_300353b186d0848c390a64e70f" ON "user"("username")`);
        // Dropping the table also removes the indicies
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
