import { compare, hash } from "bcrypt";
import { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { Connection } from "typeorm";
import { JWT_SECRET, SALT_ROUNDS } from "../constants";
import { User } from "../entity/User";

export const postAuth = async (req: Request, res: Response) => {
  try {
    const {
      email = "",
      password = "",
      pw_cost = 3000,
      pw_salt = ""
    } = req.body;
    const dbConnection: Connection = req.app.get("dbConnection");
    const serverHashedPassword = await hash(password, +SALT_ROUNDS);
    let newUser: User = new User();
    newUser.email = email.toLowerCase().trim();
    newUser.password = serverHashedPassword;
    newUser.pwCost = pw_cost;
    newUser.pwSalt = pw_salt;
    newUser = await dbConnection.manager.save(newUser);
    const jwt = sign(JSON.parse(JSON.stringify(newUser)), JWT_SECRET, {
      expiresIn: "10h"
    });
    res.status(200).json({ jwt });
  } catch (error) {
    // tslint:disable-next-line no-console
    console.error(error);
    res.status(500).json({
      errors: ["Could not create user!", error]
    });
  }
};

export const patchAuth = async (req: Request, res: Response) => {
  try {
    const {
      email = "",
      password = "",
      password_confirmation = "",
      current_password = ""
    } = req.body;
    if (password !== password_confirmation) {
      throw Error("Passwords do not match.");
    }
    const dbConnection: Connection = req.app.get("dbConnection");
    const user = await dbConnection.manager.findOne(User, {
      email: email.toLowerCase().trim()
    });
    if (!user) {
      throw Error("User does not exist.");
    }
    const passwordsMatch = await compare(current_password, user.password);
    if (passwordsMatch) {
      const serverHashedPassword = await hash(password, +SALT_ROUNDS);
      user.password = serverHashedPassword;
      await dbConnection.manager.save(user);
      res.status(204);
    } else {
      throw Error("Invalid password.");
    }
  } catch (error) {
    // tslint:disable-next-line no-console
    console.error(error);
    res.status(500).json({
      errors: ["Could not update password!", error]
    });
  }
};

export const postAuthSignIn = async (req: Request, res: Response) => {
  try {
    const { email = "", password = "" } = req.body;
    const dbConnection: Connection = req.app.get("dbConnection");
    const user = await dbConnection.manager.findOne(User, {
      email: email.toLowerCase().trim()
    });
    if (!user) {
      throw Error("User does not exist.");
    }
    const passwordsMatch = await compare(password, user.password);
    if (passwordsMatch) {
      const token = sign(JSON.parse(JSON.stringify(user)), JWT_SECRET, {
        expiresIn: "10h"
      });
      res.status(200).json({ token });
    } else {
      throw Error("Invalid password.");
    }
  } catch (error) {
    // tslint:disable-next-line no-console
    console.error(error);
    res.status(500).json({
      errors: ["Could not authenticate user!", error]
    });
  }
};

export const getAuthParams = async (req: Request, res: Response) => {
  try {
    const { email = "" } = req.body;
    const dbConnection: Connection = req.app.get("dbConnection");
    const user = await dbConnection.manager.findOne(User, {
      email: email.toLowerCase().trim()
    });
    if (user) {
      res.status(200).json({
        pw_cost: user.pwCost,
        pw_salt: user.pwSalt
      });
    } else {
      res.status(400).json({
        errors: ["User not found for given email."]
      });
    }
  } catch (error) {
    // tslint:disable-next-line no-console
    console.error(error);
    res.status(500).json({
      errors: ["Could not get authentication params!", error]
    });
  }
};
