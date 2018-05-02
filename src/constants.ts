import { version } from "pjson";

const APP_VERSION = version;

// Environment Variables (SEE README)

// This is always test for coverage
/* istanbul ignore next */
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || "3000";
const SQL_USER = process.env.SQL_USER || "pguser";
const SQL_HOST = process.env.SQL_HOST || "localhost";
const SQL_PASSWORD = process.env.SQL_PASSWORD || "mysecretpassword";
const SQL_DB = process.env.SQL_DB || "udiadb";
const SQL_PORT = process.env.SQL_PORT || "5432";
const JWT_SECRET = process.env.JWT_SECRET || "DEVELOPMENT_SECRET";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3001";
const CLIENT_DOMAINNAME = process.env.CLIENT_DOMAINNAME || "localhost:3001";
const CLIENT_PROTOCOL = process.env.CLIENTPROTOCOL || "http";
const EMAIL_TOKEN_TIMEOUT = process.env.EMAIL_TOKEN_TIMEOUT || "3600000";
const SMTP_USERNAME =
  process.env.SMTP_USERNAME || "xxlvhieo2gqp352o@ethereal.email";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "rCJTErmv6v2uacmdRt";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.ethereal.email";
const SMTP_PORT = process.env.SMTP_PORT || "587";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const HEALTH_METRIC_INTERVAL = process.env.HEALTH_METRIC_INTERVAL || "500";
const DEV_JWT = process.env.DEV_JWT || "";

export {
  APP_VERSION,
  NODE_ENV,
  PORT,
  SQL_USER,
  SQL_HOST,
  SQL_PASSWORD,
  SQL_DB,
  SQL_PORT,
  JWT_SECRET,
  CORS_ORIGIN,
  CLIENT_DOMAINNAME,
  CLIENT_PROTOCOL,
  EMAIL_TOKEN_TIMEOUT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_HOST,
  SMTP_PORT,
  REDIS_URL,
  HEALTH_METRIC_INTERVAL,
  DEV_JWT
};
