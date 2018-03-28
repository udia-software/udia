import { getConnection } from "typeorm";
import { User } from "../entity/User";
import Auth from "./Auth";

export default class UserManager {
  /**
   * Add a new user to the database, return the user and JWT.
   * @param username User supplied public facing handle
   * @param email User supplied email address
   * @param password Client side hashed password (for additional rehash)
   * @param pwCost Password cost for client crypto derivation
   * @param pwSalt Password salt for client crypto derivation
   * @param pwFunc Password function for client crypto derivation (pbkdf2)
   * @param pwDigest Password digest for client crypto derivation (sha512)
   */
  public static async createUser(
    username: string,
    email: string,
    password: string,
    pwCost: number,
    pwSalt: string,
    pwFunc: string,
    pwDigest: string
  ) {
    const userExists = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .where("email = :email", { email })
      .orWhere("username = :username", { username })
      .getCount();
    if (userExists > 0) {
      throw new Error("User already exists.");
    }
    const pwHash = await Auth.hashPassword(password);
    let newUser = new User();
    newUser.username = username;
    newUser.email = email.toLowerCase().trim();
    newUser.password = pwHash;
    newUser.pwCost = pwCost;
    newUser.pwSalt = pwSalt;
    newUser.pwFunc = pwFunc;
    newUser.pwDigest = pwDigest;
    newUser = await getConnection().manager.save(newUser);
    return {
      user: newUser,
      jwt: Auth.signUserJWT(newUser)
    };
  }

  /**
   * Update a user's password. Return if successful (or throw an error)
   * @param id user's UUID
   * @param newPw new password
   * @param pw existing password
   */
  public static async updateUserPassword(
    id: string,
    newPw: string,
    pw: string
  ) {
    if (!id) {
      throw new Error("Invalid of expired JWT.");
    }
    const user = await getConnection()
      .getRepository(User)
      .findOneById(id);
    if (!user) {
      throw new Error("User does not exist.");
    }
    const passwordsMatch = await Auth.verifyPassword(user.password, pw);
    if (passwordsMatch) {
      const serverHashedPassword = await Auth.hashPassword(newPw);
      user.password = serverHashedPassword;
      return getConnection()
        .getRepository(User)
        .save(user);
    }
    throw new Error("Invalid password.");
  }

  public static async signInUser(email: string, pw: string) {
    const user = await getConnection()
      .getRepository(User)
      .findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new Error("User does not exist.");
    }
    const passwordsMatch = await Auth.verifyPassword(user.password, pw);
    if (passwordsMatch) {
      return { user, jwt: Auth.signUserJWT(user) };
    }
    throw new Error("Invalid password.");
  }

  public static async getUserAuthParams(email: string) {
    const user = await getConnection()
      .getRepository(User)
      .findOne({ email: email.toLowerCase().trim() });
    if (user) {
      return {
        pwCost: user.pwCost,
        pwSalt: user.pwSalt,
        pwFunc: user.pwFunc,
        pwDigest: user.pwDigest
      };
    }
    throw new Error("User not found for given email.");
  }

  public static async deleteUser(id: string, pw: string) {
    const user = await getConnection()
      .getRepository(User)
      .findOneById(id);
    if (!user) {
      throw new Error("User does not exist.");
    }
    const passwordsMatch = await Auth.verifyPassword(user.password, pw);
    if (passwordsMatch) {
      return getConnection().getRepository(User).deleteById(id);
    }
    throw new Error("Invalid password.");
  }
}
