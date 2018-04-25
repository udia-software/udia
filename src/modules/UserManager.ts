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

export interface ISignInUserParams {
  email: string;
  pw: string;
}

export interface IAddEmailParams {
  email: string;
}

export interface IRemoveEmailParams {
  email: string;
}

export interface IDeleteUserParams {
  pw: string;
}

export interface ISendEmailVerificationParams {
  email: string;
}

export interface IVerifyEmailTokenParams {
  emailToken: string;
}

export interface ISendForgotPasswordEmailParams {
  email: string;
}

export default class UserManager {
  /**
   * Get the user given the user's uuid
   * @param id uuid
   */
  public static async getUserById(id: string) {
    return getConnection()
      .getRepository(User)
      .findOne(id);
  }

  /**
   * Get the user given the user's username
   * @param username string
   */
  public static async getUserByUsername(username: string = "") {
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
   * @param parameters GraphQL createUser parameters
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

    const lUsername = username.toLowerCase().trim();
    if (lUsername.length > 24) {
      errors.push({
        key: "username",
        message: "Username is too long (over 24 characters)."
      });
    } else if (lUsername.length < 3) {
      errors.push({
        key: "username",
        message: "Username is too short (under 3 characters)."
      });
    } else {
      const userExists = await getConnection()
        .getRepository(User)
        .createQueryBuilder("user")
        .where({ lUsername })
        .getCount();
      if (userExists > 0) {
        errors.push({ key: "username", message: "Username is taken." });
      }
    }

    const emailExists = await this.emailExists(email);
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
    newUser.lUsername = lUsername;
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
    });
    await this.sendEmailVerification({ email: newEmail.email });
    return {
      user: newUser,
      jwt: Auth.signUserJWT(newUser)
    };
  }

  /**
   * Update a given user's password.
   * @param username username derived from signed JWT payload
   * @param parameters new password parameters
   */
  public static async updatePassword(
    username: string = "",
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
   * @param parameters email and password
   */
  public static async signInUser({ email, pw }: ISignInUserParams) {
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
   * @param username username derived from JWT payload
   * @param parameters delete user GQL parameters
   */
  public static async deleteUser(
    username: string = "",
    { pw }: IDeleteUserParams
  ) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([{ key: "id", message: "Invalid JWT." }]);
    }
    const passwordsMatch = await Auth.verifyPassword(user.pwHash, pw);
    if (!passwordsMatch) {
      throw new ValidationError([{ key: "pw", message: "Invalid password." }]);
    }
    return getConnection()
      .getRepository(User)
      .delete({ uuid: user.uuid });
  }

  /**
   * Add a new email to a given user.
   * @param username user's username
   * @param email new email that the user wants to add
   */
  public static async addEmail(
    username: string = "",
    { email }: IAddEmailParams
  ) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([{ key: "id", message: "Invalid JWT." }]);
    }
    const emailExists = await this.emailExists(email);
    if (emailExists > 0) {
      throw new ValidationError([{ key: "email", message: "Email is taken." }]);
    }

    const newUserEmail = new UserEmail();
    newUserEmail.lEmail = email.trim().toLowerCase();
    newUserEmail.email = email.trim();
    newUserEmail.primary = false;
    newUserEmail.verified = false;
    newUserEmail.user = user;
    await getConnection()
      .getRepository(UserEmail)
      .save(newUserEmail);
    await this.sendEmailVerification({ email: newUserEmail.email });
    return user;
  }

  /**
   * Remove an email for a given user.
   * @param username user's username
   * @param email email that the user wants to remove
   */
  public static async removeEmail(
    username: string = "",
    { email }: IRemoveEmailParams
  ) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([{ key: "id", message: "Invalid JWT." }]);
    }
    const lEmail = email.toLowerCase().trim();
    const emailExists = user.emails.filter(uEmail => uEmail.lEmail === lEmail);
    if (emailExists.length === 0) {
      throw new ValidationError([{ key: "email", message: "Invalid Email." }]);
    }
    // ensure that at least one primary email will remain
    const otherEmails: {
      [email: string]: { verified: boolean; primary: boolean };
    } = {};
    let nextEmail: string = "";
    user.emails.forEach(uEmail => {
      if (uEmail.lEmail !== lEmail) {
        otherEmails[uEmail.lEmail] = {
          verified: uEmail.verified,
          primary: uEmail.primary
        };
        if (uEmail.primary) {
          nextEmail = uEmail.lEmail;
        }
        if (uEmail.verified && !nextEmail) {
          nextEmail = uEmail.lEmail;
        }
      }
    });
    if (!nextEmail) {
      throw new ValidationError([
        { key: "email", message: "Cannot orphan user." }
      ]);
    }

    // Delete the email, ensure that the primary email still exists
    await getConnection().transaction(async transactionEntityManager => {
      await transactionEntityManager.delete(UserEmail, lEmail);
      await transactionEntityManager.update(UserEmail, nextEmail, {
        primary: true
      });
    });
    return this.getUserById(user.uuid);
  }

  /**
   * Send a email verification token.
   * @param email user's email (should be tied to a UserEmail instance)
   */
  public static async sendEmailVerification({
    email
  }: ISendEmailVerificationParams) {
    const uEmail = await this.getUserEmailByEmail(email);
    if (uEmail) {
      // Token is in the format `<email>:<password>`
      const emailToken = `${uEmail.lEmail}:${randomBytes(16).toString("hex")}`;
      await getConnection()
        .getRepository(UserEmail)
        .update(uEmail.lEmail, {
          verificationHash: await Auth.hashPassword(emailToken)
        });
      await Mailer.sendEmailVerification(
        uEmail.user.username,
        email,
        emailToken
      );
      return true;
    }
    return false;
  }

  /**
   * Verify a given email token.
   * @param emailToken user's email token `${email}:${token}`
   */
  public static async verifyEmailToken({
    emailToken
  }: IVerifyEmailTokenParams) {
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
            await getConnection()
              .getRepository(UserEmail)
              .update(uEmail.lEmail, { verified: true, verificationHash: "" });
            return true;
          }
        }
      }
    }
    return false;
  }

  public static async sendForgotPasswordEmail({
    email
  }: ISendForgotPasswordEmailParams) {
    const uEmail = await this.getUserEmailByEmail(email);
    if (!uEmail) {
      throw new ValidationError([
        { key: "email", message: "Email not found." }
      ]);
    }
    const forgotPasswordToken = `${uEmail.user.lUsername}:${randomBytes(
      16
    ).toString("hex")}`;
    await getConnection()
      .getRepository(User)
      .update(uEmail.user.uuid, {
        forgotPwHash: await Auth.hashPassword(forgotPasswordToken),
        forgotPwExpiry: new Date(Date.now() + +EMAIL_TOKEN_TIMEOUT)
      });
    return true;
  }

  private static async emailExists(email: string) {
    return getConnection()
      .getRepository(UserEmail)
      .createQueryBuilder("userEmail")
      .where({ lEmail: email.toLowerCase().trim() })
      .getCount();
  }

  /**
   * Private helper method to get the UserEmail entity from an email
   * @param email user's email
   */
  private static async getUserEmailByEmail(email: string) {
    return getConnection()
      .getRepository(UserEmail)
      .findOne(email.toLowerCase().trim(), { relations: ["user"] });
  }
}
