"use strict";
const user_controller_1 = require("./user.controller");
const auth_service_1 = require("../../auth/auth.service");
class UserRoutes {
    static init(router) {
        router
            .route("/api/users")
            .get(auth_service_1.AuthService.isAuthenticated(), user_controller_1.UserController.getAll)
            .post(user_controller_1.UserController.createUser);
        router
            .route("/api/users/:id")
            .get(user_controller_1.UserController.getUser)
            .post(user_controller_1.UserController.changePassword)
            .delete(user_controller_1.UserController.deleteUser);
    }
}
exports.UserRoutes = UserRoutes;
