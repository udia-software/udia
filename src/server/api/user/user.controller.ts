/**
 * Created by alexander on 2016-12-19.
 */
import * as express from "express";
import UserDAO from "./user.dao";
import {User} from "./user.schema";

export class UserController {
  static getAll(req: express.Request, res: express.Response): void {
    UserDAO["getAll"]()
      .then((users: User[]) => res.status(200).json(users))
      .catch((error: Error) => res.status(400).json(error));
  }

  static getUser(req: express.Request, res: express.Response): void {
    let _id = req.params.id;
    UserDAO["getUser"](_id)
      .then((user: User) => res.status(200).json(user))
      .catch((error: Error) => res.status(400).json(error));
  }

  static createUser(req: express.Request, res: express.Response): void {
    let _user = req.body;
    UserDAO["createUser"](_user)
      .then((user: User) => res.status(201).json(user))
      .catch((error: Error) => res.status(400).json(error));
  }

  static deleteUser(req: express.Request, res: express.Response): void {
    let _id = req.params.id;
    UserDAO["deleteUser"](_id)
      .then(() => res.status(204).end())
      .catch((error: Error) => res.status(400).json(error));
  }

  static changePassword(req: express.Request, res: express.Response): void {
    let _id = req.params.id;
    let oldPass = req.body.oldPass;
    let newPass = req.body.newPass;
    UserDAO["changePassword"](_id, oldPass, newPass)
      .then(() => res.status(200).end())
      .catch((error: Error) => res.status(400).json(error));
  }
}