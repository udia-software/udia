import { NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { Connection } from "typeorm";
import { User } from "../entity/User";
import Auth from "../modules/Auth";
import UserManager from "../modules/UserManager";
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
    const { user, jwt } = await UserManager.createUser(
      username,
      email,
      pw,
      pwCost,
      pwSalt,
      pwFunc,
      pwDigest
    );
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
    await UserManager.updateUserPassword(id, newPw, pw);
    res.status(204).end();
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
    const payload = await UserManager.signInUser(email, pw);
    res.status(200).json(payload);
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
    const authParams = await UserManager.getUserAuthParams(email);
    res.status(200).json(authParams);
  } catch (error) {
    logger.error("ERR getAuthParams", error);
    res.status(500).json({
      errors: ["Could not get authentication params!", error]
    });
  }
};
