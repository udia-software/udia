/**
 * Created by alexander on 2016-12-08.
 */
import * as express from "express";
import ThingDAO from "./thing.dao";
import {Thing} from "./thing.model";

export class ThingController {
  static getAll(req: express.Request, res: express.Response): void {
    ThingDAO["getAll"]()
      .then((things: Thing[]) => res.status(200).json(things))
      .catch((error: any) => res.status(400).json(error));
  }

  static createThing(req: express.Request, res: express.Response): void {
    let _thing = req.body;
    ThingDAO["createThing"](_thing)
      .then((thing: Thing) => res.status(201).json(thing))
      .catch((error: any) => res.status(400).json(error));
  }

  static deleteThing(req: express.Request, res: express.Response): void {
    let _id = req.params.id;

    ThingDAO["deleteThing"](_id)
      .then(() => res.status(200).end())
      .catch((error: any) => res.status(400).json(error));
  }
}