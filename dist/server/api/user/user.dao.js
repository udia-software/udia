"use strict";
/**
 * Created by alexander on 2016-12-19.
 */
const mongoose = require("mongoose");
const Promise = require("bluebird");
const _ = require("lodash");
const user_schema_1 = require("./user.schema");
const auth_service_1 = require("../../auth/auth.service");
user_schema_1.default.static("getAll", () => {
    return new Promise((resolve, reject) => {
        let _query = {};
        User
            .find(_query, "-salt -password")
            .exec((err, users) => {
            err ? reject(err)
                : resolve(users);
        });
    });
});
/**
 * Create the user, then return the token.
 */
user_schema_1.default.static("createUser", (user) => {
    return new Promise((resolve, reject) => {
        if (!_.isObject(user)) {
            return reject(new TypeError("User is not a valid object."));
        }
        let _user = new User(user);
        _user.save((err, saved) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({ token: auth_service_1.AuthService.signToken(saved._id, saved.get("role")) });
            }
        });
    });
});
user_schema_1.default.static("deleteUser", (id) => {
    return new Promise((resolve, reject) => {
        if (!_.isString(id)) {
            return reject(new TypeError("ID is not a valid string."));
        }
        User
            .findByIdAndRemove(id)
            .exec((err, deleted) => {
            err ? reject(err)
                : resolve();
        });
    });
});
user_schema_1.default.static("changePassword", (id, oldPass, newPass) => {
    return new Promise((resolve, reject) => {
        User.findById(id).exec()
            .then((user) => {
            if (user.authenticate(oldPass)) {
                user.password = newPass;
                return user.save()
                    .then(() => {
                    resolve();
                })
                    .catch((err) => {
                    reject(err);
                });
            }
        });
    });
});
user_schema_1.default.static("getUser", (id) => {
    return new Promise((resolve, reject) => {
        if (!_.isString(id)) {
            return reject(new TypeError("ID is not a valid string."));
        }
        User.findOne({ _id: id }, "-salt -password").exec()
            .then(user => {
            resolve(user);
        })
            .catch((err) => {
            reject(err);
        });
    });
});
let User = mongoose.model("User", user_schema_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = User;
