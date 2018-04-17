import { Server } from "http";
import { getConnection } from "typeorm";
import start from "../../src";
import { PORT } from "../../src/constants";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import UserManager from "../../src/modules/UserManager";
import { generateUserCryptoParams } from "../testHelper";

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
    .orWhere("lUsername = :shrugUsername", { shrugUsername: "¯\\_(ツ)_/¯" })
    .execute();
}

beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = `${parseInt(PORT, 10) + 3}`;
  server = await start(userTestPort);
  await deleteUsers();
  await createUsers();
  done();
});

afterAll(async done => {
  await deleteUsers();
  server.close(done);
});

describe("UserManager", () => {
  describe("getUserByUsername", () => {
    it("should handle no username supplied", async done => {
      const user = await UserManager.getUserByUsername();
      expect(user).toBeUndefined();
      done();
    });
  });

  describe("createUser", () => {
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
      done("Should have thrown username and email taken error.");
    });

    it("should handle username too long", async done => {
      try {
        await UserManager.createUser({
          username: "somelongusernamehere12345",
          email: "somelongusernamehere12345@udia.ca",
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
            "* username: Username is too long (over 24 characters)."
        );
        done();
        return;
      }
      done("Should have thrown username too long error.");
    });

    it("should handle username too short", async done => {
      try {
        await UserManager.createUser({
          username: "na",
          email: "na@udia.ca",
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
            "* username: Username is too short (under 3 characters)."
        );
        done();
        return;
      }
      done("Should have thrown username too short error.");
    });

    it("should handle unicode usernames", async done => {
      const shrugUser = await UserManager.createUser({
        username: "¯\\_(ツ)_/¯",
        email: "shrug@udia.ca",
        pw: "temp",
        pwFunc: "pbkdf2",
        pwDigest: "sha512",
        pwCost: 3000,
        pwKeySize: 768,
        pwSalt: "salt"
      });
      expect(shrugUser).toHaveProperty("jwt");
      expect(shrugUser).toHaveProperty("user");
      const user = shrugUser.user;
      expect(user).toHaveProperty("lUsername", "¯\\_(ツ)_/¯");
      expect(user).toHaveProperty("username", "¯\\_(ツ)_/¯");
      done();
    });
  });

  describe("updatePassword", () => {
    it("should handle password update invalid jwt", async done => {
      const {
        pw,
        mk: newPw,
        pwFunc,
        pwDigest,
        pwCost,
        pwKeySize,
        pwSalt
      } = generateUserCryptoParams("badActor@udia.ca", "Dupe S3C$^T P~!۩s");
      try {
        await UserManager.updatePassword(undefined, {
          newPw,
          pw,
          pwFunc,
          pwDigest,
          pwCost,
          pwKeySize,
          pwSalt
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* id: Invalid JWT."
        );
        done();
        return;
      }
      done("Should have thrown invalid JWT error.");
    });

    it("should handle password update invalid password", async done => {
      const {
        pw,
        mk: newPw,
        pwFunc,
        pwDigest,
        pwCost,
        pwKeySize,
        pwSalt
      } = generateUserCryptoParams("dupeuser@udia.ca", "Dupe S3C$^T P~!۩s");
      try {
        await UserManager.updatePassword("dupeuser", {
          newPw,
          pw: `b${pw}d`,
          pwFunc,
          pwDigest,
          pwCost,
          pwKeySize,
          pwSalt
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* pw: Invalid password."
        );
        done();
        return;
      }
      done("Should have thrown invalid password error.");
    });
  });

  describe("signInUser", () => {
    it("should handle sign in email not found", async done => {
      const { pw } = generateUserCryptoParams(
        "badActor@udia.ca",
        "Dupe S3C$^T P~!۩s"
      );
      try {
        await UserManager.signInUser({ email: "badActor@udia.ca", pw });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Email not found."
        );
        done();
        return;
      }
      done("Should have thrown email not found error.");
    });
    it("should handle sign in invalid password", async done => {
      const { pw } = generateUserCryptoParams(
        "dupeuser@udia.ca",
        "Dupe S3C$^T P~!۩s"
      );
      try {
        await UserManager.signInUser({
          email: "dupeuser@udia.ca",
          pw: `b${pw}d`
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* pw: Invalid password."
        );
        done();
        return;
      }
      done("Should have thrown invalid password error.");
    });
  });

  describe("deleteUser", () => {
    it("should handle delete user invalid jwt", async done => {
      const { pw } = generateUserCryptoParams(
        "badActor@udia.ca",
        "Dupe S3C$^T P~!۩s"
      );
      try {
        await UserManager.deleteUser(undefined, { pw });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* id: Invalid JWT."
        );
        done();
        return;
      }
      done("Should have thrown invalid jwt error.");
    });

    it("should handle delete user invalid password", async done => {
      const { pw } = generateUserCryptoParams(
        "badActor@udia.ca",
        "Dupe S3C$^T P~!۩s"
      );
      try {
        await UserManager.deleteUser("dupeuser", { pw });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* pw: Invalid password."
        );
        done();
        return;
      }
      done("Should have thrown invalid password error.");
    });
  });

  describe("addEmail", () => {
    it("should handle add email invalid jwt", async done => {
      try {
        await UserManager.addEmail(undefined, "badActor@udia.ca");
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* id: Invalid JWT."
        );
        done();
        return;
      }
      done("Should have thrown invalid jwt error.");
    });

    it("should handle add email email exists", async done => {
      try {
        await UserManager.addEmail("dupeuser", "dupeuser@udia.ca");
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Email is taken."
        );
        done();
        return;
      }
      done("Should have thrown email exists error.");
    });
  })

  describe("sendEmailVerification", () => {
    it("should handle invalid email", async done => {
      const emailSent = await UserManager.sendEmailVerification(undefined);
      expect(emailSent).toBeFalsy();
      done();
    });
  });

  describe("verifyEmailToken", () => {
    it("should handle invalid token", async done => {
      let emailVerified = await UserManager.verifyEmailToken(undefined);
      expect(emailVerified).toBeFalsy();
      emailVerified = await UserManager.verifyEmailToken("a:b@c.ca:tok3n")
      expect(emailVerified).toBeFalsy();
      done();
    });
  });
});
