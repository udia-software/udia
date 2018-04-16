import { hash, verify } from "argon2";
import { NextFunction, Request, Response } from "express";
import { sign, verify as jwtVerify } from "jsonwebtoken";
import { JWT_SECRET } from "../constants";
import { User } from "../entity/User";

export interface IJwtPayload {
  username?: string;
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
  public static async verifyPassword(passwordHash: string, password: string) {
    return verify(passwordHash, password);
  }

  /**
   * Create a signed JSON Web Token given a user.
   * @param userInstance instance of the user
   */
  public static signUserJWT(userInstance: User) {
    const jwtPayload: IJwtPayload = { username: userInstance.username };
    return sign(jwtPayload, JWT_SECRET, {
      algorithm: Auth.ALGORITHM,
      expiresIn: Auth.EXPIRES_IN,
      notBefore: Auth.NOT_BEFORE
    });
  }

  /**
   * Return the verified jwt payload, or return null.
   * @param jsonwebtoken raw token portion of Authorizaton header
   */
  public static verifyUserJWT(jsonwebtoken: string) {
    try {
      return jwtVerify(jsonwebtoken, JWT_SECRET, {
        algorithms: [Auth.ALGORITHM]
      });
    } catch {
      return null;
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

  // Default JSON Web Token options
  private static ALGORITHM = "HS256";
  private static EXPIRES_IN = "8h";
  private static NOT_BEFORE = 0;
}
