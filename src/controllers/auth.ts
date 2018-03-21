import { Request, Response } from "express";

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

export const getAuthParams = (req: Request, res: Response) => {
  try {
    const { email = "" } = req.body;
    throw Error("to be implemented");
  } catch (error) {
    res.status(500).json({
      errors: ["Could not get authentication params!", error]
    });
  }
};
