"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pjson_1 = require("pjson");
const APP_VERSION = pjson_1.version;
exports.APP_VERSION = APP_VERSION;
// environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
exports.NODE_ENV = NODE_ENV;
const PORT = process.env.PORT || "3000";
exports.PORT = PORT;
const SQL_USER = process.env.SQL_USER || "";
exports.SQL_USER = SQL_USER;
const SQL_HOST = process.env.SQL_HOST || "";
exports.SQL_HOST = SQL_HOST;
const SQL_DB = process.env.SQL_DB || "";
exports.SQL_DB = SQL_DB;
const SQL_PASSWORD = process.env.SQL_PASSWORD || "";
exports.SQL_PASSWORD = SQL_PASSWORD;
const SQL_PORT = process.env.SQL_PORT || "";
exports.SQL_PORT = SQL_PORT;
const SQL_CONN_STR = process.env.SQL_CONN_STR || "postgres://root@localhost:26257/udiadb";
exports.SQL_CONN_STR = SQL_CONN_STR;
//# sourceMappingURL=constants.js.map