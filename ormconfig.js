/**
 * TypeORM ormconfig options for more detail.
 * http://typeorm.io/#/using-ormconfig
 */
const NODE_ENV = process.env.NODE_ENV || "development";
const TYPEORM_TYPE = process.env.TYPEORM_TYPE || "postgres";
const TYPEORM_LOGGING = process.env.TYPEORM_LOGGING || "true";
const SQL_USER = process.env.SQL_USER || "pguser"; // root
const SQL_PASSWORD = process.env.SQL_PASSWORD || "mysecretpassword";
const SQL_HOST = process.env.SQL_HOST || "localhost";
let SQL_DB = process.env.SQL_DB || "udiadb";
let SQL_PORT = process.env.SQL_PORT || "5432"; // 26527

// During Development and Production, we care about the compiled files.
const entitiesConfig = ["dist/entity/**/*.js"];
const migrationsConfig = ["dist/migration/**/*.js"];
const subscribersConfig = ["dist/subscriber/**/*.js"];

if (NODE_ENV === "test") {
  // During Test, we perform transformations on the fly. Map to source.
  entitiesConfig[0] = "src/entity/**/*.ts";
  migrationsConfig[0] = "src/migration/**/*.ts";
  subscribersConfig[0] = "src/subscriber/**/*.ts";
  SQL_DB = process.env.SQL_TEST_DB || "udiadbtest";
  SQL_PORT = process.env.SQL_TEST_PORT || "5433";
}

module.exports = {
  type: TYPEORM_TYPE,
  host: SQL_HOST,
  username: SQL_USER,
  password: SQL_PASSWORD,
  database: SQL_DB,
  port: parseInt(SQL_PORT, 10),
  synchronize: false,
  logging: TYPEORM_LOGGING === "true",
  entities: entitiesConfig,
  migrations: migrationsConfig,
  subscribers: subscribersConfig,
  cli: {
    // Command line interface only needs to modify the source.
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber"
  }
};
