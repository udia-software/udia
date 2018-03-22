import { Request, Response } from "express";
import { Connection } from "typeorm";
import { User } from "../entity/User";

export const postAuth = (req: Request, res: Response) => {
  try {
    const { email = "", password = "", pw_cost = "", pw_salt = "" } = req.body;
    throw Error("to be implemented");
  } catch (error) {
    res.status(500).json({
      errors: ["Could not create user!", error]
    });
  }
};

export const patchAuth = (req: Request, res: Response) => {
  try {
    const {
      email = "",
      password = "",
      password_confirmation = "",
      current_password = ""
    } = req.body;
    throw Error("to be implemented");
  } catch (error) {
    res.status(500).json({
      errors: ["Could not update password!", error]
    });
  }
};

export const postAuthSignIn = (req: Request, res: Response) => {
  try {
    const { email = "", password = "" } = req.body;
    throw Error("to be implemented");
  } catch (error) {
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
    res.status(500).json({
      errors: ["Could not get authentication params!", error]
    });
  }
};
