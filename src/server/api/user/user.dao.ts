/**
 * Created by alexander on 2016-12-19.
 */
import * as mongoose from "mongoose";
import * as Promise from "bluebird";
import * as _ from "lodash";
import userSchema from "./user.schema";

userSchema.static("getAll", (): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    let _query = {};
    User
      .find(_query, "-salt -password")
      .exec((err, users) => {
        err ? reject(err)
          : resolve(users);
      });
  });
});

userSchema.static("createUser", (user: Object): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    if (!_.isObject(user)) {
      return reject(new TypeError("User is not a valid object."));
    }
    let _user = new User(user);
    _user.save((err, saved) => {
      err ? reject(err)
        : resolve(saved);
    });
  });
});

userSchema.static("deleteUser", (id: string): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    if (!_.isString(id)) {
      return reject(new TypeError("ID is not a valid string."));
    }
    User
      .findByIdAndRemove(id)
      .exec((err, deleted) => {
        err ? reject(err)
          : resolve();
      });
  });
});

userSchema.static("changePassword", (id: string, oldPass: string, newPass: string): Promise <any> => {
  return new Promise((resolve: Function, reject: Function) => {
    User.findById(id).exec()
      .then((user: any) => {
        if (user.authenticate(oldPass)) {
          user.password = newPass;
          return user.save()
            .then(() => {
              resolve()
            })
            .catch((err: Error) => {
              reject(err)
            })
        }
      });
  });
});

userSchema.static("getUser", (id: string): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    if (!_.isString(id)) {
      return reject(new TypeError("ID is not a valid string."));
    }
    User.findOne({_id: id}, "-salt -password").exec()
      .then(user => {
        resolve(user);
      })
      .catch((err: Error) => {
        reject(err);
      })

  })
});

let User = mongoose.model("User", userSchema);

export default User;