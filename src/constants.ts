import { version } from "pjson";

const APP_VERSION = version;
// environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || "3000";

export { APP_VERSION, NODE_ENV, PORT };
