"use strict";
const thing_dao_1 = require("./thing.dao");
class ThingController {
    static getAll(req, res) {
        thing_dao_1.default["getAll"]()
            .then((things) => res.status(200).json(things))
            .catch((error) => res.status(400).json(error));
    }
    static createThing(req, res) {
        let _thing = req.body;
        thing_dao_1.default["createThing"](_thing)
            .then((thing) => res.status(201).json(thing))
            .catch((error) => res.status(400).json(error));
    }
    static deleteThing(req, res) {
        let _id = req.params.id;
        thing_dao_1.default["deleteThing"](_id)
            .then(() => res.status(204).end())
            .catch((error) => res.status(400).json(error));
    }
}
exports.ThingController = ThingController;
