import { Connection } from "typeorm";
import { User } from "../entity/User";
import Auth from "./Auth";

export default class UserManager {
  /**
   * Add a new user to the database, return the user and JWT.
   * @param dbConn TypeORM database connection
   * @param username User supplied public facing handle
   * @param email User supplied email address
   * @param password Client side hashed password (for additional rehash)
   * @param pwCost Password cost for client crypto derivation
   * @param pwSalt Password salt for client crypto derivation
   */
  public static async createUser(
    dbConn: Connection,
    username: string,
    email: string,
    password: string,
    pwCost: number,
    pwSalt: string
  ) {
    const userExists = await dbConn
      .getRepository(User)
      .createQueryBuilder("user")
      .where("email = :email", { email })
      .orWhere("username = :username", { username })
      .getCount();
    if (userExists > 0) {
      throw new Error("User already exists.")
    }
    const pwHash = await Auth.hashPassword(password);
    let newUser = new User();
    newUser.email = email;
    newUser.password = pwHash;
    newUser.pwCost = pwCost;
    newUser.pwSalt = pwSalt;
    newUser = await dbConn.manager.save(newUser);
    return {
      user: newUser,
      jwt: Auth.signUserJWT(newUser)
    };
  }
}
