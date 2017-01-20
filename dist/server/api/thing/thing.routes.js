"use strict";
const thing_controller_1 = require("./thing.controller");
class ThingRoutes {
    static init(router) {
        router
            .route("/api/things")
            .get(thing_controller_1.ThingController.getAll)
            .post(thing_controller_1.ThingController.createThing);
        router
            .route("/api/things/:id")
            .delete(thing_controller_1.ThingController.deleteThing);
    }
}
exports.ThingRoutes = ThingRoutes;
