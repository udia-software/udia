/**
 * Created by alexander on 2016-12-24.
 */
import * as express from "express";
import * as jwt from "jsonwebtoken";
import User from "../api/user/user.dao";

export class AuthService {
  private static SESSION_SECRET: string = process.env.SESSION_SECRET || "SECRET_GOES_HERE";

  /**
   * Return the signed token string given the user id and role
   * @param id {string} User's mongoose id
   * @param role {string} User's role in the application
   * @returns {string} Signed token string
   */
  public static signToken(id: string, role: string): string {
    return jwt.sign({_id: id, role}, AuthService.SESSION_SECRET, {
      expiresIn: 60 * 60 * 5
    });
  }

  /**
   * If the token exists, and it maps to a given user, call the next function with req.user as the user.
   * Otherwise throw 401 unauthorized error.
   */
  public static isAuthenticated() {
    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
      if (!req["auth"] || !req["auth"]["_id"]) {
        return res.status(401).end();
      }
      User.findById(req["auth"]["_id"]).exec()
        .then(user => {
          if (!user) {
            return res.status(401).end();
          }
          req.user = user;
          next();

        })
        .catch(err => {
          next(err);
        });
    };
  }
}
