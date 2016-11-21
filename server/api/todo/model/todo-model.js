"use strict";
var mongoose = require('mongoose');
var schema = new mongoose.Schema({
    todoMessage: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = schema;
