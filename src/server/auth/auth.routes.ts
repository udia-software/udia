/**
 * Created by alexander on 2016-12-24.
 */
import * as express from "express";
import {AuthController} from "./auth.controller";

export class AuthRoutes {
  static init(router: express.Router) {
    router
      .route("/auth/local")
      .post(AuthController.authenticateLocal);
  }
}