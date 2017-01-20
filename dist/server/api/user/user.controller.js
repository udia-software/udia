"use strict";
const user_dao_1 = require("./user.dao");
class UserController {
    static getAll(req, res) {
        user_dao_1.default["getAll"]()
            .then((users) => res.status(200).json(users))
            .catch((error) => res.status(400).json(error));
    }
    static getUser(req, res) {
        let _id = req.params.id;
        user_dao_1.default["getUser"](_id)
            .then((user) => res.status(200).json(user))
            .catch((error) => res.status(400).json(error));
    }
    static createUser(req, res) {
        let _user = req.body;
        user_dao_1.default["createUser"](_user)
            .then((user) => res.status(201).json(user))
            .catch((error) => res.status(400).json(error));
    }
    static deleteUser(req, res) {
        let _id = req.params.id;
        user_dao_1.default["deleteUser"](_id)
            .then(() => res.status(204).end())
            .catch((error) => res.status(400).json(error));
    }
    static changePassword(req, res) {
        let _id = req.params.id;
        let oldPass = req.body.oldPass;
        let newPass = req.body.newPass;
        user_dao_1.default["changePassword"](_id, oldPass, newPass)
            .then(() => res.status(200).end())
            .catch((error) => res.status(400).json(error));
    }
}
exports.UserController = UserController;
