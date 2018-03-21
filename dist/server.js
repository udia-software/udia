"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const constants_1 = require("./constants");
const server = app_1.default.listen(constants_1.PORT, () => {
    // tslint:disable-next-line no-console
    console.log(`UDIA ${constants_1.NODE_ENV} server running on port ${constants_1.PORT}`);
});
exports.default = server;
//# sourceMappingURL=server.js.map