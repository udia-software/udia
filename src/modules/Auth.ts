import { hash, verify } from "argon2";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import { sign, verify as jwtVerify } from "jsonwebtoken";
import { getConnection } from "typeorm";
import { JWT_SECRET } from "../constants";
import { User } from "../entity/User";

export default class Auth {
  /**
   * Given a string client password, return the password hash.
   * @param password user supplied password. (should be hashed on client too)
   */
  public static async hashPassword(password: string) {
    return hash(password);
  }

  public static async verifyPassword(passwordHash: string, password: string) {
    return verify(passwordHash, password);
  }

  public static signUserJWT(userPayload: User) {
    return sign({ id: userPayload.uuid }, JWT_SECRET, {
      algorithm: Auth.ALGORITHM,
      expiresIn: Auth.EXPIRES_IN,
      notBefore: Auth.NOT_BEFORE
    });
  }

  public static verifyUserJWT(jsonwebtoken: string) {
    return jwtVerify(jsonwebtoken, JWT_SECRET, {
      algorithms: [Auth.ALGORITHM]
    });
  }

  public static verifyUserJWTMiddleware() {
    return jwt({
      secret: JWT_SECRET,
      credentialsRequired: false,
      algorithms: [Auth.ALGORITHM]
    });
  }

  // Default JSON Web Token options
  private static ALGORITHM = "HS256";
  private static EXPIRES_IN = "8h";
  private static NOT_BEFORE = 0;
}
