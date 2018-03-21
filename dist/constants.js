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
//# sourceMappingURL=constants.js.map