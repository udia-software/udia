"use strict";
/**
 * Created by udia on 2016-12-31.
 */
const passport = require("passport");
const passport_local_1 = require("passport-local");
const user_dao_1 = require("../api/user/user.dao");
class AuthPassport {
    static localAuthenticate(username, password, done) {
        user_dao_1.default.findOne({
            username: username.toLowerCase()
        }).exec()
            .then(user => {
            if (!user) {
                return done(null, false, {
                    message: "This username is not registered."
                });
            }
            user["authenticate"](password, (authError, authenticated) => {
                if (authError) {
                    return done(authError);
                }
                if (!authenticated) {
                    return done(null, false, { message: "This password is not correct." });
                }
                else {
                    return done(null, user);
                }
            });
        })
            .catch(err => done(err));
    }
    static setup() {
        passport.use(new passport_local_1.Strategy({
            usernameField: "username",
            passwordField: "password"
        }, function (username, password, done) {
            return AuthPassport.localAuthenticate(username, password, done);
        }));
    }
}
exports.AuthPassport = AuthPassport;
