import { Client } from "pg";
import {
  SQL_CONN_STR,
  SQL_DB,
  SQL_HOST,
  SQL_PASSWORD,
  SQL_PORT,
  SQL_USER
} from "./constants";

let dbClient: Client = new Client({
  connectionString: SQL_CONN_STR
});

if (!SQL_CONN_STR) {
  dbClient = new Client({
    user: SQL_USER,
    host: SQL_HOST,
    database: SQL_DB,
    password: SQL_PASSWORD,
    port: parseInt(SQL_PORT, 10),
  });
}

export default dbClient;
