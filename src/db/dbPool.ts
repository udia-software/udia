import { Pool } from "pg";
import {
  SQL_CONN_STR,
  SQL_DB,
  SQL_HOST,
  SQL_PASSWORD,
  SQL_PORT,
  SQL_USER
} from "../constants";

let dbPool: Pool = new Pool({ connectionString: SQL_CONN_STR });

if (!SQL_CONN_STR) {
  dbPool = new Pool({
    user: SQL_USER,
    host: SQL_HOST,
    database: SQL_DB,
    password: SQL_PASSWORD,
    port: parseInt(SQL_PORT, 10)
  });
}

export default dbPool;
