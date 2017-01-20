"use strict";
/**
 * Created by alexander on 2016-12-08.
 */
const mongoose = require("mongoose");
// To reference this mongoose.Schema:
// import thingSchema from "./thing.schema";
let schema = new mongoose.Schema({
    message: {
        type: String, required: true, trim: true
    },
    createdAt: { type: Date, default: Date.now }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = schema;
