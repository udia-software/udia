/**
 * Created by alexander on 2016-12-24.
 */
import * as express from "express";
import * as passport from "passport";
import {User} from "../api/user/user.schema";
import {AuthService} from "./auth.service";

export class AuthController {
  static authenticateLocal(req: express.Request, res: express.Response, next: express.NextFunction): void {
    passport.authenticate("local", function (err: Error, user: User, info: any) {
      let error = err || info;
      if (error) {
        return res.status(401).json(error);
      }
      if (!user) {
        return res.status(401).json({message: "Something went wrong, please try again."});
      }
      let token = AuthService.signToken(user.id, user.role);
      res.json({token});
    })(req, res, next);
  }
}