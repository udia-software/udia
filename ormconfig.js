/**
 * TypeORM ormconfig options for more detail.
 * http://typeorm.io/#/using-ormconfig
 */
const TYPEORM_TYPE = process.env.TYPEORM_TYPE || "postgres";
const SQL_USER = process.env.SQL_USER || "pguser"; // root
const SQL_HOST = process.env.SQL_HOST || "localhost";
const SQL_DB = process.env.SQL_DB || "udiadb";
const SQL_PASSWORD = process.env.SQL_PASSWORD || "mysecretpassword";
const SQL_PORT = process.env.SQL_PORT || "5432"; // 26527

module.exports = {
  type: TYPEORM_TYPE,
  host: SQL_HOST,
  port: parseInt(SQL_PORT, 10),
  username: SQL_USER,
  password: SQL_PASSWORD,
  database: SQL_DB,
  synchronize: true,
  logging: true,
  entities: ["dist/entity/**/*.js"],
  migrations: ["dist/migration/**/*.js"],
  subscribers: ["dist/subscriber/**/*.js"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber"
  }
};
