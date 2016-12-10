/**
 * Created by alexander on 2016-12-08.
 */
import * as express from "express";
import {ThingController} from "./thing.controller";

export class ThingRoutes {
  static init(router: express.Router) {
    router
      .route("/api/things")
      .get(ThingController.getAll)
      .post(ThingController.createThing);

    router
      .route("/api/things/:id")
      .delete(ThingController.deleteThing);
  }
}