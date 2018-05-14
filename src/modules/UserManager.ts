import { randomBytes } from "crypto";
import { getConnection, getRepository, Not } from "typeorm";
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

export interface IResetPasswordParams {
  resetToken: string;
  newPw: string;
  pwFunc: string;
  pwDigest: string;
  pwCost: number;
  pwKeySize: number;
  pwSalt: string;
}

export interface IResetTokenValidity {
  isValid: boolean;
  expiry: Date | null;
}

export interface ISetPrimaryEmailParams {
  email: string;
}

export default class UserManager {
  /**
   * Get the user given the user's uuid
   * @param id uuid
   */
  public static async getUserById(id: string) {
    return getRepository(User).findOne(id);
  }

  /**
   * Get the user given the user's username
   * @param username string
   */
  public static async getUserByUsername(username: string = "") {
    return getRepository(User).findOne({
      lUsername: (username || "").toLowerCase().trim()
    });
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
    await UserManager.handleValidateUsername(username, errors);
    await UserManager.handleValidateEmail(email, errors);
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
    });
    await this.sendEmailVerification({ email: newEmail.email });
    return {
      user: newUser,
      jwt: Auth.signUserJWT(newUser)
    };
  }

  /**
   * Update a given user's password and password generation params
   * @param username username derived from signed JWT payload
   * @param params new password parameters
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
    return getRepository(User).save(user);
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
    return getRepository(User).delete({ uuid: user.uuid });
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
    const errors: IErrorMessage[] = [];
    const user = await this.getUserByUsername(username);
    if (!user) {
      errors.push({ key: "id", message: "Invalid JWT." });
    }
    await this.handleValidateEmail(email, errors);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const newUserEmail = new UserEmail();
    newUserEmail.lEmail = email.trim().toLowerCase();
    newUserEmail.email = email.trim();
    newUserEmail.primary = false;
    newUserEmail.verified = false;
    newUserEmail.user = user!;
    await getRepository(UserEmail).save(newUserEmail);
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
    const uEmails = user.emails.filter(uEmail => uEmail.lEmail === lEmail);
    if (uEmails.length === 0) {
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
        if (uEmail.primary || (uEmail.verified && !nextEmail)) {
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

  public static async setPrimaryEmail(
    username: string = "",
    { email }: ISetPrimaryEmailParams
  ) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([{ key: "id", message: "Invalid JWT." }]);
    }
    const lEmail = email.toLowerCase().trim();
    const uEmails = user.emails.filter(uEmail => uEmail.lEmail === lEmail);
    if (uEmails.length === 0) {
      throw new ValidationError([{ key: "email", message: "Invalid Email." }]);
    }
    if (!uEmails[0].verified) {
      throw new ValidationError([
        { key: "email", message: "Email must be verified." }
      ]);
    }

    // ensure that only one verified, primary email exists
    await getConnection().transaction(async transactionEntityManager => {
      await transactionEntityManager.update(UserEmail, lEmail, {
        primary: true
      });
      await transactionEntityManager.update(
        UserEmail,
        {
          user,
          lEmail: Not(lEmail)
        },
        { primary: false }
      );
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
    if (!uEmail) {
      throw new ValidationError([
        { key: "email", message: "Email not found." }
      ]);
    }
    // Token is in the format `<email>:<password>`
    const emailToken = `${uEmail.lEmail}:${randomBytes(16).toString("hex")}`;
    await getRepository(UserEmail).update(uEmail.lEmail, {
      verificationHash: await Auth.hashPassword(emailToken),
      verificationExpiry: new Date(Date.now() + +EMAIL_TOKEN_TIMEOUT)
    });
    await Mailer.sendEmailVerification(
      uEmail.user.username,
      uEmail.email,
      emailToken
    );
    return true;
  }

  /**
   * Verify a given email token.
   * @param emailToken user's email token `${email}:${token}`
   */
  public static async verifyEmailToken({
    emailToken
  }: IVerifyEmailTokenParams) {
    const [email] = emailToken.split(":");
    if (!email) {
      throw new ValidationError([
        { key: "emailToken", message: "Invalid token." }
      ]);
    }
    const uEmail = await this.getUserEmailByEmail(email);
    if (!uEmail) {
      throw new ValidationError([
        { key: "emailToken", message: "Email not found." }
      ]);
    }
    if (uEmail.verified) {
      throw new ValidationError([
        { key: "emailToken", message: "Email already verified." }
      ]);
    }
    const errors: IErrorMessage[] = [];
    if (!uEmail.verificationExpiry || uEmail.verificationExpiry < new Date()) {
      errors.push({ key: "emailToken", message: "Token is expired." });
    }
    const isMatch = await Auth.verifyPassword(
      uEmail.verificationHash,
      emailToken
    );
    if (!isMatch) {
      errors.push({ key: "emailToken", message: "Invalid secret." });
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    await getRepository(UserEmail).update(uEmail.lEmail, {
      verified: true,
      verificationHash: null,
      verificationExpiry: null
    });
    return true;
  }

  /**
   * Send the forgot password reset instructions to the given email
   * @param params email to send forgot password to
   */
  public static async sendForgotPasswordEmail({
    email
  }: ISendForgotPasswordEmailParams) {
    const uEmail = await this.getUserEmailByEmail(email);
    if (!uEmail) {
      throw new ValidationError([
        { key: "email", message: "Email not found." }
      ]);
    }
    const id = uEmail.user.lUsername;
    const forgotPasswordToken = `${id}:${randomBytes(16).toString("hex")}`;
    await getRepository(User).update(uEmail.user.uuid, {
      forgotPwHash: await Auth.hashPassword(forgotPasswordToken),
      forgotPwExpiry: new Date(Date.now() + +EMAIL_TOKEN_TIMEOUT)
    });
    await Mailer.sendForgotPasswordEmail(
      uEmail.user.username,
      uEmail.email,
      forgotPasswordToken
    );
    return true;
  }

  /**
   * Reset the user's password and password generation params
   * @param params parameters for resetting user password
   */
  public static async resetPassword({
    resetToken,
    newPw,
    pwFunc,
    pwDigest,
    pwCost,
    pwKeySize,
    pwSalt
  }: IResetPasswordParams) {
    const [username] = resetToken.split(":");
    if (!username) {
      throw new ValidationError([
        { key: "resetToken", message: "Invalid token." }
      ]);
    }
    let user = await this.getUserByUsername(username);
    if (!user) {
      throw new ValidationError([
        { key: "resetToken", message: "User not found." }
      ]);
    }
    const errors: IErrorMessage[] = [];
    if (!user.forgotPwExpiry || user.forgotPwExpiry < new Date()) {
      errors.push({ key: "resetToken", message: "Token is expired." });
    }
    const isMatch = await Auth.verifyPassword(user.forgotPwHash, resetToken);
    if (!isMatch) {
      errors.push({ key: "resetToken", message: "Invalid secret." });
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    // Update the user with the new password parameters.
    const serverHashedPassword = await Auth.hashPassword(newPw);
    user.pwHash = serverHashedPassword;
    user.pwFunc = pwFunc;
    user.pwDigest = pwDigest;
    user.pwCost = pwCost;
    user.pwKeySize = pwKeySize;
    user.pwSalt = pwSalt;
    user.forgotPwExpiry = null;
    user.forgotPwHash = null;
    user = await getRepository(User).save(user);
    return { user, jwt: Auth.signUserJWT(user) };
  }

  /**
   * Check whether or not a password reset token is valid
   * @param resetToken reset token provided to the user
   */
  public static async checkResetToken(resetToken: string) {
    const validityPayload: IResetTokenValidity = {
      isValid: false,
      expiry: null
    };
    const [username] = resetToken.split(":");
    if (!username) {
      return validityPayload;
    }
    const user = await this.getUserByUsername(username);
    if (!user) {
      return validityPayload;
    }
    const isSecretValid = await Auth.verifyPassword(
      user.forgotPwHash,
      resetToken
    );
    const isDateValid =
      !!user.forgotPwExpiry && user.forgotPwExpiry > new Date();
    if (isSecretValid && isDateValid) {
      validityPayload.isValid = true;
      validityPayload.expiry = user.forgotPwExpiry;
    }
    return validityPayload;
  }

  /**
   * Get number of emails matching the provided email string
   * @param email - email to check existance in the database
   * @returns Promise<number> - should be 0 or 1
   */
  public static async emailExists(email: string = "") {
    const errors: IErrorMessage[] = [];
    const count = await this.handleValidateEmail(email, errors);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    return count;
  }

  /**
   * Get number of usernames matching the provided username string
   * @param username - username to check existance in database
   * @returns Promise<number> - should be 0 or 1
   */
  public static async usernameExists(username: string = "") {
    const errors: IErrorMessage[] = [];
    const count = await this.handleValidateUsername(username, errors);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    return count;
  }

  private static async handleValidateUsername(
    username: string,
    errors: IErrorMessage[]
  ) {
    const lUsername = (username || "").toLowerCase().trim();
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
    }
    const userExists = await getRepository(User)
      .createQueryBuilder("user")
      .where({ lUsername })
      .getCount();
    if (userExists > 0) {
      errors.push({ key: "username", message: "Username is taken." });
    }
    return userExists;
  }

  private static async handleValidateEmail(
    email: string,
    errors: IErrorMessage[]
  ) {
    // Regular Expression for catching 99% of all emails taken from https://emailregex.com/
    const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const lEmail = (email || "").toLowerCase().trim();
    if (!EMAIL_REGEX.test(lEmail)) {
      errors.push({ key: "email", message: "Email is invalid." });
    }
    const emailExists = await getRepository(UserEmail)
      .createQueryBuilder("userEmail")
      .where({ lEmail })
      .getCount();
    if (emailExists > 0) {
      errors.push({ key: "email", message: "Email is taken." });
    }
    return emailExists;
  }

  /**
   * Private helper method to get the UserEmail entity from an email
   * @param email user's email
   */
  private static async getUserEmailByEmail(email: string) {
    const lEmail = (email || "").toLowerCase().trim();
    return getRepository(UserEmail).findOne(lEmail, {
      relations: ["user"]
    });
  }
}
