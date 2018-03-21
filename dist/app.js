"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metric_1 = __importDefault(require("./metric"));
const app = express_1.default();
exports.app = app;
app.use("/", (req, res, next) => {
    res.json(metric_1.default());
});
exports.default = app;
//# sourceMappingURL=app.js.map