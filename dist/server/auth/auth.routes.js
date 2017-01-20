"use strict";
const auth_controller_1 = require("./auth.controller");
class AuthRoutes {
    static init(router) {
        router
            .route("/auth/local")
            .post(auth_controller_1.AuthController.authenticateLocal);
    }
}
exports.AuthRoutes = AuthRoutes;
