/**
 * TypeORM ormconfig options for more detail.
 * http://typeorm.io/#/using-ormconfig
 */
const NODE_ENV = process.env.NODE_ENV || "development";

// Gross & quick parse Database url with some defaults (Heroku)
const DATABASE_URL = process.env.DATABASE_URL || "";
const DB_REGEXP = new RegExp(
  `^([a-zA-Z]+):\/\/` +   // idx 1, driver
  `([a-zA-Z0-9]+):` +     // idx 2, user
  `([a-zA-Z0-9]*)@` +     // idx 3, password
  `([a-zA-Z0-9\-\.]+):` + // idx 4, host
  `(\\d+)\/` +            // idx 5, port
  `([a-zA-Z0-9]+)`        // idx 6, database
);
let dbDefault = {
  dbDriver: "postgres",
  dbUser: "pguser",
  dbPassword: "mysecretpassword",
  dbHost: "127.0.0.1",
  dbValue: "udiadb",
  dbPort: "5432",
};
const evalDBURL = DB_REGEXP.exec(DATABASE_URL);
if (evalDBURL) {
  dbDefault.dbDriver = evalDBURL[1] || dbDefault.dbDriver;
  dbDefault.dbUser = evalDBURL[2] || dbDefault.dbUser;
  dbDefault.dbPassword = evalDBURL[3] || dbDefault.dbPassword;
  dbDefault.dbHost = evalDBURL[4] || dbDefault.dbHost;
  dbDefault.dbPort = evalDBURL[5] || dbDefault.dbPort;
  dbDefault.dbValue = evalDBURL[6] || dbDefault.dbValue;
}

const TYPEORM_TYPE = process.env.TYPEORM_TYPE || dbDefault.dbDriver;
const TYPEORM_LOGGING = process.env.TYPEORM_LOGGING || "true";
const SQL_USER = process.env.SQL_USER || dbDefault.dbUser;
const SQL_PASSWORD = process.env.SQL_PASSWORD || dbDefault.dbPassword;
const SQL_HOST = process.env.SQL_HOST || dbDefault.dbHost;
let SQL_DB = process.env.SQL_DB || dbDefault.dbValue;
let SQL_PORT = process.env.SQL_PORT || dbDefault.dbPort;

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