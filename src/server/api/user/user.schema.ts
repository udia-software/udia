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
    type: String, trim: true
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
  .get(function () {
    return {
      _id: this._id,
      role: this.role
    };
  });

schema.path("username")
  .validate(function (username: string): boolean {
    return username.length >= 4;
  }, "Username must be 4 characters or longer.");

schema.path("username")
  .validate(function (value: string, respond: Function) {
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
      .catch(function (err: Error) {
        throw err;
      });
  }, "The specified username is already in use.");

schema.pre("save", function (next) {
  // Handle new/update passwords
  if (!this.isModified("password")) {
    return next();
  }

  if (!this.password || !this.password.length) {
    return next(new Error("Invalid Password"));
  }

  this.makeSalt((saltErr: Error, salt: Buffer) => {
    if (saltErr) {
      return next(saltErr);
    }
    this.salt = salt;
    this.encryptPassword(this.password, (encryptErr: Error, hashedPassword: string) => {
      if (encryptErr) {
        return next(encryptErr);
      }
      this.password = hashedPassword;
      next();
    });
  });
});


schema.methods = {
  /**
   * Authenticate, check if the passwords are the same
   *
   * @param {string} password
   * @param {Function} callback
   * @returns {boolean}
   */
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

  /**
   * Make Salt
   *
   * @param {Function} callback
   */
    makeSalt(callback: Function) {
    return crypto.randomBytes(32, (err: Error, salt: Buffer) => {
      if (err) {
        return callback(err);
      } else {
        return callback(null, salt.toString("base64"));
      }
    });
  },

  /**
   * Encrypt the password
   *
   * @param {String} password
   * @param {Function} callback
   * @returns {String}
   */
    encryptPassword(password: string, callback: Function) {
    if (!password || !this.salt) {
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
      return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, "sha512")
        .toString("base64");
    }

    return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, "sha512", (err: Error, key: Buffer) => {
      if (err) {
        return callback(err);
      } else {
        return callback(null, key.toString("base64"));
      }
    });
  }
};

export default schema;
