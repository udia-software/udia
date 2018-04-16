import { randomBytes } from "crypto";
import { getConnection } from "typeorm";
import { EMAIL_TOKEN_TIMEOUT } from "../constants";
import { User } from "../entity/User";
import { UserEmail } from "../entity/UserEmail";
import Mailer from "../mailer";
import Auth from "./Auth";
import { IErrorMessage, ValidationError } from "./ValidationError";

export interface ICreateUserParams {
  username: string;
  email: string;
  pw: string;
  pwFunc: string;
  pwDigest: string;
  pwCost: number;
  pwKeySize: number;
  pwSalt: string;
}

export interface IUpdatePasswordParams {
  newPw: string;
  pw: string;
  pwFunc: string;
  pwDigest: string;
  pwCost: number;
  pwKeySize: number;
  pwSalt: string;
}

export default class UserManager {
  /**
   * Get the user given the user's uuid
   * @param id uuid (typically from the jwt payload)
   */
  public static async getUserById(id: string) {
    return getConnection()
      .getRepository(User)
      .findOneById(id);
  }

  /**
   * Get the user given the user's username
   * @param username string
   */
  public static async getUserByUsername(username: string) {
    return getConnection()
      .getRepository(User)
      .findOne({ lUsername: username.toLowerCase().trim() });
  }

  /**
   * Get the user given an email
   * @param email string
   */
  public static async getUserByEmail(email: string) {
    const userEmail = await this.getUserEmailByEmail(email);
    if (userEmail && userEmail.user) {
      return userEmail.user;
    }
  }

  /**
   * Add a new user to the database, return the user and JWT.
   */
  public static async createUser({
    username,
    email,
    pw,
    pwFunc,
    pwDigest,
    pwCost,
    pwKeySize,
    pwSalt
  }: ICreateUserParams) {
    const errors: IErrorMessage[] = [];

    const userExists = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .where({ lUsername: username.toLowerCase().trim() })
      .getCount();
    if (userExists > 0) {
      errors.push({ key: "username", message: "Username is taken." });
    }

    const emailExists = await getConnection()
      .getRepository(UserEmail)
      .createQueryBuilder("userEmail")
      .where({ lEmail: email.toLowerCase().trim() })
      .getCount();
    if (emailExists > 0) {
      errors.push({ key: "email", message: "Email is taken." });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const pwHash = await Auth.hashPassword(pw);
    let newUser = new User();
    const newEmail = new UserEmail();
    newEmail.email = email.trim();
    newEmail.lEmail = email.toLowerCase().trim();
    newEmail.primary = true;
    newEmail.verified = false;
    newUser.username = username.trim();
    newUser.lUsername = username.toLowerCase().trim();
    newUser.pwHash = pwHash;
    newUser.pwFunc = pwFunc;
    newUser.pwDigest = pwDigest;
    newUser.pwCost = pwCost;
    newUser.pwKeySize = pwKeySize;
    newUser.pwSalt = pwSalt;
    await getConnection().transaction(async transactionEntityManager => {
      newUser = await transactionEntityManager.save(newUser);
      newEmail.user = newUser;
      await transactionEntityManager.save(newEmail);
      this.sendEmailVerification(newEmail.email);
    });
    return {
      user: newUser,
      jwt: Auth.signUserJWT(newUser)
    };
  }

  /**
   * Update a user's password. Return if successful (or throw an error)
   * @param username user's username
   * @param newPw new password
   * @param pw existing password
   */
  public static async updatePassword(
    username: string,
    {
      newPw,
      pw,
      pwFunc,
      pwDigest,
      pwCost,
      pwKeySize,
      pwSalt
    }: IUpdatePasswordParams
  ) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([{ key: "id", message: "Invalid JWT." }]);
    }

    const passwordsMatch = await Auth.verifyPassword(user.pwHash, pw);
    if (!passwordsMatch) {
      throw new ValidationError([{ key: "pw", message: "Invalid password." }]);
    }

    const serverHashedPassword = await Auth.hashPassword(newPw);
    user.pwHash = serverHashedPassword;
    user.pwFunc = pwFunc;
    user.pwDigest = pwDigest;
    user.pwCost = pwCost;
    user.pwKeySize = pwKeySize;
    user.pwSalt = pwSalt;
    return getConnection()
      .getRepository(User)
      .save(user);
  }

  /**
   * Sign in a user. Return the user and jwt (or throw an error)
   * @param email one of the user's emails
   * @param pw password
   */
  public static async signInUser(email: string, pw: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new ValidationError([
        {
          key: "email",
          message: "Email not found."
        }
      ]);
    }
    const passwordsMatch = await Auth.verifyPassword(user.pwHash, pw);
    if (!passwordsMatch) {
      throw new ValidationError([
        {
          key: "pw",
          message: "Invalid password."
        }
      ]);
    }
    return { user, jwt: Auth.signUserJWT(user) };
  }

  /**
   * Get a user's client side password derivation parameters
   * @param email user's email
   */
  public static async getUserAuthParams(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new ValidationError([
        { key: "email", message: "Email not found." }
      ]);
    }
    return {
      pwCost: user.pwCost,
      pwSalt: user.pwSalt,
      pwFunc: user.pwFunc,
      pwDigest: user.pwDigest,
      pwKeySize: user.pwKeySize
    };
  }

  /**
   * Delete a user, resolve with true or throw error.
   * @param username user's username
   * @param pw user's client generated password
   */
  public static async deleteUser(username: string, pw: string) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([{ key: "id", message: "Invalid JWT." }]);
    }
    const passwordsMatch = await Auth.verifyPassword(user.pwHash, pw);
    if (passwordsMatch) {
      await getConnection()
        .getRepository(User)
        .deleteById(user.uuid);
      return passwordsMatch;
    }
    throw new ValidationError([{ key: "pw", message: "Invalid password." }]);
  }

  /**
   * Send a email verification token.
   * @param email user's email
   */
  public static async sendEmailVerification(email: string) {
    const uEmail = await this.getUserEmailByEmail(email);
    if (uEmail) {
      const emailToken = `${uEmail.lEmail}:${randomBytes(16).toString("hex")}`;
      uEmail.verificationHash = await Auth.hashPassword(emailToken);
      await getConnection()
        .getRepository(UserEmail)
        .updateById(uEmail.lEmail, uEmail);
      Mailer.sendEmailVerification(uEmail.user.username, email, emailToken);
      return true;
    }
    return false;
  }

  /**
   * Verify a given email token.
   * @param emailToken user's email token `${email}:${token}`
   */
  public static async verifyEmailToken(emailToken: string) {
    const [email] = emailToken.split(":");
    if (email) {
      const uEmail = await this.getUserEmailByEmail(email);
      if (uEmail) {
        if (
          new Date(Date.now() - parseInt(EMAIL_TOKEN_TIMEOUT, 10)) <
          uEmail.updatedAt
        ) {
          const isMatch = await Auth.verifyPassword(
            uEmail.verificationHash,
            emailToken
          );
          if (isMatch) {
            uEmail.verified = true;
            uEmail.verificationHash = "";
            await getConnection()
              .getRepository(UserEmail)
              .updateById(uEmail.email, uEmail);
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Private helper method to get the UserEmail entity from an email
   * @param email user's email
   */
  private static async getUserEmailByEmail(email: string) {
    return getConnection()
      .getRepository(UserEmail)
      .findOne({
        where: { lEmail: email.toLowerCase().trim() },
        relations: ["user"]
      });
  }
}
