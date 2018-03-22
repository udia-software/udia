import { version } from "pjson";

const APP_VERSION = version;

// environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || "3000";
const SALT_ROUNDS = process.env.SALT_ROUNDS || "12";
const JWT_SECRET = process.env.JWT_SECRET || "DEVELOPMENT_SECRET";

export { APP_VERSION, NODE_ENV, PORT, SALT_ROUNDS, JWT_SECRET };
