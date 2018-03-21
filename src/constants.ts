import { version } from "pjson";

const APP_VERSION = version;
// environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || "3000";
const SQL_USER = process.env.SQL_USER || "";
const SQL_HOST = process.env.SQL_HOST || "";
const SQL_DB = process.env.SQL_DB || "";
const SQL_PASSWORD = process.env.SQL_PASSWORD || "";
const SQL_PORT = process.env.SQL_PORT || "";
const SQL_CONN_STR = process.env.SQL_CONN_STR || "postgres://root@localhost:26257/udiadb";


export {
  APP_VERSION,
  NODE_ENV,
  PORT,
  SQL_USER,
  SQL_HOST,
  SQL_DB,
  SQL_PASSWORD,
  SQL_PORT,
  SQL_CONN_STR
};
