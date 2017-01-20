"use strict";
/**
 * Created by alexander on 2016-12-08.
 */
const mongoose = require("mongoose");
const Promise = require("bluebird");
const _ = require("lodash");
const thing_schema_1 = require("./thing.schema");
thing_schema_1.default.static("getAll", () => {
    return new Promise((resolve, reject) => {
        let _query = {};
        Thing
            .find(_query)
            .exec((err, things) => {
            err ? reject(err)
                : resolve(things);
        });
    });
});
thing_schema_1.default.static("createThing", (thing) => {
    return new Promise((resolve, reject) => {
        if (!_.isObject(thing)) {
            return reject(new TypeError("Thing is not a valid object."));
        }
        let _thing = new Thing(thing);
        _thing.save((err, saved) => {
            err ? reject(err)
                : resolve(saved);
        });
    });
});
thing_schema_1.default.static("deleteThing", (id) => {
    return new Promise((resolve, reject) => {
        if (!_.isString(id)) {
            return reject(new TypeError("ID is not a valid string."));
        }
        Thing
            .findByIdAndRemove(id)
            .exec((err, deleted) => {
            err ? reject(err)
                : resolve();
        });
    });
});
let Thing = mongoose.model("Thing", thing_schema_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Thing;
