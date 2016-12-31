/**
 * Created by udia on 2016-12-31.
 */
import * as passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import User from "../api/user/user.dao";

export class AuthPassport {
  static localAuthenticate(username: string, password: string, done: Function) {
    User.findOne({
      username: username.toLowerCase()
    }).exec()
      .then(user => {
        if (!user) {
          return done(null, false, {
            message: "This username is not registered."
          });
        }
        user["authenticate"](password, (authError: Error, authenticated: boolean) => {
          if (authError) {
            return done(authError);
          }
          if (!authenticated) {
            return done(null, false, {message: "This password is not correct."});
          } else {
            return done(null, user);
          }
        });
      })
      .catch(err => done(err));
  }

  static setup() {
    passport.use(new LocalStrategy({
      usernameField: "username",
      passwordField: "password"
    }, function (username, password, done) {
      return AuthPassport.localAuthenticate(username, password, done);
    }));
  }
}
