/**
 * Created by alexander on 2016-12-19.
 */
import * as express from "express";
import {UserController} from "./user.controller";

export class UserRoutes {
  static init(router: express.Router) {
    router
      .route("/api/users")
      .get(UserController.getAll)
      .post(UserController.createUser);

    router
      .route("/api/users/:id")
      .get(UserController.getUser)
      .post(UserController.changePassword)
      .delete(UserController.deleteUser);
  }
}