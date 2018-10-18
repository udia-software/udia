import dotenv from "dotenv";
import path from "path";
import {
  database as dbValue,
  host as dbHost,
  password as dbPassword,
  port as dbPort,
  username as dbUsername
} from "../ormconfig.js";
import {
  name,
  version
} from "../package.json";

dotenv.config(); // can also set environment variables using .env file

/* istanbul ignore next: node env always test */
export const NODE_ENV = process.env.NODE_ENV || "development";

// Constants for file system relative paths
export const APP_VERSION = version;
export const APP_NAME = name;
export const LOG_DIR = path.join(__dirname, "..", "log");
export const EMAIL_TEMPLATES_DIR = path.join(
  __dirname,
  "..",
  "static",
  "emails"
);
export const LEGAL_DIR = path.join(__dirname, "..", "static", "legal");

// Environment Variables (SEE README)
export const PORT = process.env.PORT || "3000";
export const SQL_USER = process.env.SQL_USER || dbUsername;
export const SQL_HOST = process.env.SQL_HOST || dbHost;
export const SQL_PASSWORD = process.env.SQL_PASSWORD || dbPassword;
export const SQL_DB = process.env.SQL_DB || dbValue;
export const SQL_PORT = process.env.SQL_PORT || dbPort;
export const JWT_SECRET = process.env.JWT_SECRET || "DEVELOPMENT_SECRET";
export const JWT_ALGORITHM = process.env.JWT_ALGORITHM || "HS256";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://127.0.0.1:8000";
export const CLIENT_DOMAINNAME =
  process.env.CLIENT_DOMAINNAME || "127.0.0.1:8000";
export const CLIENT_PROTOCOL = process.env.CLIENTPROTOCOL || "http";
export const EMAIL_TOKEN_TIMEOUT = process.env.EMAIL_TOKEN_TIMEOUT || "3600000";
export const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@udia.ca";
export const REPLY_TO_EMAIL_NAME =
  process.env.REPLY_TO_EMAIL_NAME || "Alexander Wong";
export const REPLY_TO_EMAIL_ADDR =
  process.env.REPLY_TO_EMAIL_ADDR || "alex@udia.ca";
export const SMTP_USERNAME =
  process.env.SMTP_USERNAME || "xxlvhieo2gqp352o@ethereal.email";
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "rCJTErmv6v2uacmdRt";
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.ethereal.email";
export const SMTP_PORT = process.env.SMTP_PORT || "587";
export const HEALTH_METRIC_INTERVAL =
  process.env.HEALTH_METRIC_INTERVAL || "500";
export const DEV_JWT = process.env.DEV_JWT || "";
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
export const AWS_SES_REGION = process.env.AWS_SES_REGION || "us-west-2";
export const ITEMS_PAGE_LIMIT = process.env.ITEMS_PAGE_LIMIT || "32";
export const USERS_PAGE_LIMIT = process.env.USERS_PAGE_LIMIT || "32";