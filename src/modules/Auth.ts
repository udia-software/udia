import { hash, verify } from "argon2";
import { NextFunction, Request, Response } from "express";
import { sign, verify as jwtVerify } from "jsonwebtoken";
import { JWT_ALGORITHM, JWT_EXPIRES_IN, JWT_SECRET } from "../constants";
import { User } from "../entity/User";

export interface IJwtPayload {
  uuid?: string;
}

export default class Auth {
  /**
   * Given a string client password, hash the password.
   * @param password user supplied password. (should be hashed on client too)
   */
  public static async hashPassword(password: string) {
    return hash(password);
  }

  /**
   * Check whether a password matches a password hash.
   * @param passwordHash server side stored password hash
   * @param password client side provided password
   */
  public static async verifyPassword(
    passwordHash: string | any,
    password: string
  ) {
    try {
      const verified = await verify(passwordHash, password);
      return verified;
    } catch (err) {
      return false;
    }
  }

  /**
   * Create a signed JSON Web Token given a user.
   * @param userInstance instance of the user
   */
  public static signUserJWT(userInstance: User) {
    const jwtPayload: IJwtPayload = { uuid: userInstance.uuid };
    return sign(jwtPayload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRES_IN
    });
  }

  /**
   * Return the verified jwt payload, or return null.
   * @param jsonwebtoken raw token portion of Authorizaton header
   */
  public static verifyUserJWT(jsonwebtoken: string): IJwtPayload {
    try {
      return jwtVerify(jsonwebtoken, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        maxAge: JWT_EXPIRES_IN
      }) as IJwtPayload;
    } catch {
      return {};
    }
  }

  /**
   * Express middleware for verifying authorization header.
   */
  public static jwtMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Authorization: Bearer HEADER.PAYLOAD.SIGNATURE
      const rawAuthHeader = req.headers.authorization;
      if (rawAuthHeader) {
        const token = rawAuthHeader.slice("Bearer ".length);
        req.user = Auth.verifyUserJWT(token);
      }
      next();
    };
  }
}
