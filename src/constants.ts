import { version } from "pjson";

const APP_VERSION = version;

// environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || "3000";
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

export {
  APP_VERSION,
  NODE_ENV,
  PORT,
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
  HEALTH_METRIC_INTERVAL
};
