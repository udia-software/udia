/**
 * Created by alexander on 2016-12-19.
 */
import * as crypto from "crypto";
import * as mongoose from "mongoose";

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  password: string;
  provider: string;
  salt: string;
}

let schema = new mongoose.Schema({
  username: {
    type: String, required: true, trim: true, lowercase: true
  },
  name: {
    type: String, required: true, trim: true
  },
  role: {
    type: String, required: true, trim: true, default: "user"
  },
  password: {
    type: String, required: true
  },
  provider: {
    type: String
  },
  salt: {
    type: String
  }
});

// Non-sensitive info we"ll be putting in the token
schema.virtual("token")
  .get(function() {
    return {
      _id: this._id,
      role: this.role
    };
  });

schema.path("username")
  .validate(function(username: string): boolean {
    return username.length >= 4;
}, "Username must be 4 characters or longer.");

schema.path("username")
  .validate(function(value: string, respond: Function) {
    return this.constructor.findOne({username: value}).exec()
      .then((user: User) => {
        if (user) {
          if (this.id === user.id) {
            return respond(true);
          }
          return respond(false);
        }
        return respond(true);
      })
      .catch(function(err: Error) {
        throw err;
      });
  }, "The specified username is already in use.");

schema.methods = {
  authenticate(password: string, callback: Function) {
    if (!callback) {
      return this.password === this.encryptPassword(password);
    }

    this.encryptPassword(password, (err: Error, pwdGen: string) => {
      if (err) {
        return callback(err);
      }

      if (this.password === pwdGen) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    });
  },

  makeSalt(byteSize: number, callback: Function) {
    let defaultByteSize = 16;

    if (typeof arguments[0] === "function") {
      callback = arguments[0];
      byteSize = defaultByteSize;
    } else if (typeof arguments[1] === "function") {
      callback = arguments[1];
    } else {
      throw new Error("Missing Callback");
    }

    if (!byteSize) {
      byteSize = defaultByteSize;
    }

    return crypto.randomBytes(byteSize, (err: Error, salt: Buffer) => {
      if (err) {
        return callback(err);
      } else {
        return callback(null, salt.toString("base64"));
      }
    });
  },

  encryptPassword(password: string, callback: Function) {
    if (!password || !this.salt) {
      console.log(password);
      console.log(this);
      if (!callback) {
        return null;
      } else {
        return callback("Missing password or salt");
      }
    }

    let defaultIterations = 10000;
    let defaultKeyLength = 64;
    let salt = new Buffer(this.salt, "base64");

    if (!callback) {
      return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, "")
        .toString();
    }

    return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, "", (err: Error, key: Buffer) => {
      if (err) {
        return callback(err);
      } else {
        return callback(null, key.toString("base64"));
      }
    });
  }
};

export default schema;
