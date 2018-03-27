import { NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { Connection } from "typeorm";
import { User } from "../entity/User";
import Auth from "../modules/Auth";
import logger from "../util/logger";

export const postAuth = async (req: Request, res: Response) => {
  try {
    const {
      username = "",
      email = "",
      pw = "",
      pwCost = 3000,
      pwSalt = "",
      pwFunc = "",
      pwDigest = ""
    }: {
      username: string;
      email: string;
      pw: string;
      pwCost: number;
      pwSalt: string;
      pwFunc: string;
      pwDigest: string;
    } = req.body;
    const dbConnection: Connection = req.app.get("dbConnection");
    const serverHashedPassword = await Auth.hashPassword(pw);
    let newUser: User = new User();
    newUser.username = username;
    newUser.email = email.toLowerCase().trim();
    newUser.password = serverHashedPassword;
    newUser.pwCost = pwCost;
    newUser.pwSalt = pwSalt;
    newUser = await dbConnection.manager.save(newUser);
    const jwt = Auth.signUserJWT(newUser);
    res.status(200).json({ jwt });
  } catch (error) {
    logger.error("ERR postAuth", error);
    res.status(500).json({
      errors: ["Could not create user!", error]
    });
  }
};

export const patchAuth = async (req: Request, res: Response) => {
  try {
    const { newPw = "", pw = "" } = req.body;
    const id = req.user.id;
    if (!id) {
      return res.status(401).json({ errors: ["Invalid or expired JWT."] });
    }
    const dbConnection: Connection = req.app.get("dbConnection");
    const user = await dbConnection.manager.findOneById(User, id);
    if (!user) {
      return res.status(400).json({ errors: ["User does not exist."] });
    }
    const passwordsMatch = await Auth.verifyPassword(user.password, pw);
    if (passwordsMatch) {
      const serverHashedPassword = await Auth.hashPassword(newPw);
      user.password = serverHashedPassword;
      await dbConnection.manager.save(user);
      res.status(204).end();
    } else {
      res.status(400).json({ errors: ["Invalid password."] });
    }
  } catch (error) {
    logger.error("ERR patchAuth", error);
    res.status(500).json({
      errors: ["Could not update password!", error]
    });
  }
};

export const postAuthSignIn = async (req: Request, res: Response) => {
  try {
    const { email = "", pw = "" } = req.body;
    const dbConnection: Connection = req.app.get("dbConnection");
    const user = await dbConnection.manager.findOne(User, {
      email: email.toLowerCase().trim()
    });
    if (!user) {
      return res.status(400).json({ errors: ["User does not exist."] });
    }
    const passwordsMatch = await Auth.verifyPassword(user.password, pw);
    if (passwordsMatch) {
      const jwt = Auth.signUserJWT(user);
      res.status(200).json({ jwt });
    } else {
      return res.status(400).json({ errors: ["Invalid password."] });
    }
  } catch (error) {
    logger.error("ERR postAuthSignIn", error);
    res.status(500).json({
      errors: ["Could not authenticate user!", error]
    });
  }
};

export const getAuthParams = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    const dbConnection: Connection = req.app.get("dbConnection");
    const user = await dbConnection.manager.findOne(User, {
      email: email.toLowerCase().trim()
    });
    if (user) {
      res.status(200).json({
        pwCost: user.pwCost,
        pwSalt: user.pwSalt,
        pwFunc: user.pwFunc,
        pwDigest: user.pwDigest
      });
    } else {
      res.status(400).json({
        errors: ["User not found for given email."]
      });
    }
  } catch (error) {
    logger.error("ERR getAuthParams", error);
    res.status(500).json({
      errors: ["Could not get authentication params!", error]
    });
  }
};
