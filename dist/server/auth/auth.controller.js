"use strict";
const passport = require("passport");
const auth_service_1 = require("./auth.service");
class AuthController {
    static authenticateLocal(req, res, next) {
        passport.authenticate("local", function (err, user, info) {
            let error = err || info;
            if (error) {
                return res.status(401).json(error);
            }
            if (!user) {
                return res.status(401).json({ message: "Something went wrong, please try again." });
            }
            let token = auth_service_1.AuthService.signToken(user.id, user.role);
            res.json({ token });
        })(req, res, next);
    }
}
exports.AuthController = AuthController;
