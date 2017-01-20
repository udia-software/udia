"use strict";
const jwt = require("jsonwebtoken");
const user_dao_1 = require("../api/user/user.dao");
class AuthService {
    static signToken(id, role) {
        return jwt.sign({ _id: id, role }, AuthService.SESSION_SECRET, {
            expiresIn: 60 * 60 * 5
        });
    }
    /**
     * If the token exists, and it maps to a given user, call the next function with req.user as the user.
     * Otherwise throw 401 unauthorized error.
     */
    static isAuthenticated() {
        return function (req, res, next) {
            if (!req["auth"] || !req["auth"]["_id"]) {
                return res.status(401).end();
            }
            user_dao_1.default.findById(req["auth"]["_id"]).exec()
                .then(user => {
                if (!user) {
                    return res.status(401).end();
                }
                req.user = user;
                next();
            })
                .catch(err => {
                next(err);
            });
        };
    }
}
AuthService.SESSION_SECRET = process.env.SESSION_SECRET || "SECRET_GOES_HERE";
exports.AuthService = AuthService;
