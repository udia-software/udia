import { Server } from "http";
import { getConnection } from "typeorm";
import start from "../../src";
import { PORT } from "../../src/constants";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import UserManager from "../../src/modules/UserManager";

let server: Server = null;

async function createUsers() {
  await getConnection().transaction(async transactionEntityManager => {
    let dpUser = new User();
    const dpEmail = new UserEmail();
    dpEmail.email = "dupeUser@udia.ca";
    dpEmail.lEmail = "dupeuser@udia.ca";
    dpEmail.primary = true;
    dpEmail.verified = true;
    dpUser.username = "dupeUser";
    dpUser.lUsername = "dupeuser";
    dpUser.pwHash =
      "$argon2i$v=19$m=4096,t=3,p=1$5QDqoNEphcTCPUMnWL40Lg$Q1nX2c5H3DZlesJ4Nb15dL7xcHa0ZNJqnEwyZl5ewSk";
    dpUser.pwFunc = "pbkdf2";
    dpUser.pwDigest = "sha512";
    dpUser.pwCost = 3000;
    dpUser.pwSalt = "64a6e864ac0bd477aa9ead6fa4a902628bc691dc";
    dpUser = await transactionEntityManager.save(dpUser);
    dpEmail.user = dpUser;
    await transactionEntityManager.save(dpEmail);
  });
}

async function deleteUsers() {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where({ lUsername: "dupeuser" })
    .execute();
}

beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = parseInt(PORT, 10) + 3;
  server = await start(userTestPort);
  await deleteUsers();
  await createUsers();
  done();
});

afterAll(async done => {
  await deleteUsers();
  await server.close();
  done();
});

describe("UserManager", () => {
  it("should handle username or email is taken", async done => {
    try {
      await UserManager.createUser({
        username: " dUpEuSeR",
        email: "DupeUser@udia.ca ",
        pw: "temp",
        pwFunc: "pbkdf2",
        pwDigest: "sha512",
        pwCost: 3000,
        pwKeySize: 768,
        pwSalt: "salt"
      });
    } catch (err) {
      expect(err).toHaveProperty(
        "message",
        "The request is invalid.\n" +
          "* username: Username is taken.\n" +
          "* email: Email is taken."
      );
      done();
      return;
    }
    done("Username and Email should have been flagged as duplicate.");
  });
  it("should handle invalid username lengths");
  it("should handle unicode usernames");
  it("should handle password update invalid jwt");
  it("should handle password update invalid password");
  it("should handle sign in email not found");
  it("should handle sign in password invalid");
  it("should handle get auth email not found");
  it("should handle delete user invalid jwt");
  it("should handle delete user invalid password");
});
