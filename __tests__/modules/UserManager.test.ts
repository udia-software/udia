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
    const dp2Email = new UserEmail();
    dp2Email.email = "dupeUser2@udia.ca";
    dp2Email.lEmail = "dupeuser2@udia.ca";
    dp2Email.primary = false;
    dp2Email.verified = false;
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
    dp2Email.user = dpUser;
    await transactionEntityManager.save(dp2Email);

    let veUser = new User();
    const veEmail = new UserEmail();
    veEmail.email = "verifyEmailUser@udia.ca";
    veEmail.lEmail = "verifyemailuser@udia.ca";
    veEmail.primary = true;
    veEmail.verified = false;
    veEmail.verificationExpiry = new Date();
    veEmail.verificationHash = "$argon2i$v=1$m=1,t=1,p=1$101";
    veUser.username = "verifyEmailUser";
    veUser.lUsername = "verifyemailuser";
    veUser.pwHash = "$argon2i$v=1$m=1,t=1,p=1$101";
    veUser.pwFunc = "pbkdf2";
    veUser.pwDigest = "sha512";
    veUser.pwCost = 3000;
    veUser.pwSalt = "101";
    veUser = await transactionEntityManager.save(veUser);
    veEmail.user = veUser;
    await transactionEntityManager.save(veEmail);
  });
}

async function deleteUsers() {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where({ lUsername: "dupeuser" })
    .orWhere("lUsername = :shrugUsername", { shrugUsername: "¯\\_(ツ)_/¯" })
    .orWhere("lUsername = :veUsername", { veUsername: "verifyemailuser" })
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
        return done();
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
        return done();
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
        return done();
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
        return done();
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
        return done();
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
        return done();
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
        return done();
      }
      done("Should have thrown invalid password error.");
    });
  });

  describe("addEmail", () => {
    it("should handle add email invalid jwt", async done => {
      try {
        await UserManager.addEmail(undefined, { email: "badActor@udia.ca" });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* id: Invalid JWT."
        );
        return done();
      }
      done("Should have thrown invalid jwt error.");
    });

    it("should handle add email email exists", async done => {
      try {
        await UserManager.addEmail("dupeuser", { email: "dupeuser@udia.ca" });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Email is taken."
        );
        return done();
      }
      done("Should have thrown email exists error.");
    });
  });

  describe("removeEmail", () => {
    it("should handle remove email invalid jwt", async done => {
      try {
        await UserManager.removeEmail(undefined, { email: "badActor@udia.ca" });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* id: Invalid JWT."
        );
        return done();
      }
      done("Should have thrown invalid jwt error.");
    });

    it("should handle remove invalid email", async done => {
      try {
        await UserManager.removeEmail("dupeuser", { email: "" });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Invalid Email."
        );
        return done();
      }
      done("Should have thrown invalid email error.");
    });

    it("should handle orphan user attempt", async done => {
      try {
        await UserManager.removeEmail("dupeuser", {
          email: "dupeUser@udia.ca"
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Cannot orphan user."
        );
        return done();
      }
      done("Should have thrown orphan user error.");
    });

    it("should handle switch primary email", async done => {
      await getConnection()
        .getRepository(UserEmail)
        .update("dupeuser2@udia.ca", { verified: true });
      const user = await UserManager.removeEmail("dupeuser", {
        email: "dupeUser@udia.ca"
      });
      expect(user).toHaveProperty("emails");
      expect(user.emails).toHaveLength(1);
      const userEmail = user.emails[0];
      expect(userEmail).toHaveProperty("email", "dupeUser2@udia.ca");
      expect(userEmail).toHaveProperty("lEmail", "dupeuser2@udia.ca");
      expect(userEmail).toHaveProperty("primary", true);
      expect(userEmail).toHaveProperty("verified", true);
      expect(userEmail).toHaveProperty("verificationHash", null);
      expect(userEmail).toHaveProperty("createdAt");
      expect(userEmail).toHaveProperty("updatedAt");
      done();
    });
  });

  describe("setPrimaryEmail", () => {
    it("should handle set primary email invalid JWT", async done => {
      try {
        await UserManager.setPrimaryEmail(undefined, {
          email: "badActor@udia.ca"
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* id: Invalid JWT."
        );
        return done();
      }
      done("Should have thrown invalid jwt error.");
    });

    it("should handle set primary invalid email", async done => {
      try {
        await UserManager.setPrimaryEmail("dupeuser", { email: "" });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Invalid Email."
        );
        return done();
      }
      done("Should have thrown invalid email error.");
    });

    it("should handle set primary email non verified", async done => {
      await getConnection()
        .getRepository(UserEmail)
        .update("dupeuser2@udia.ca", { verified: false });
      try {
        await UserManager.setPrimaryEmail("dupeuser", {
          email: "dupeUser2@udia.ca"
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Email must be verified."
        );
        return done();
      }
      done("Should have thrown email must be verified error.");
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
        return done();
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
        return done();
      }
      done("Should have thrown invalid password error.");
    });
  });

  describe("sendEmailVerification", () => {
    it("should handle invalid email", async done => {
      try {
        await UserManager.sendEmailVerification({
          email: ""
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Email not found."
        );
        return done();
      }
      done("Should have thrown email not found error.");
    });

    it("should send an email verification email", async () => {
      expect.assertions(1);
      await expect(
        UserManager.sendEmailVerification({
          email: "dupeUser2@udia.ca"
        })
      ).resolves.toBe(true);
    });
  });

  describe("verifyEmailToken", () => {
    it("should handle invalid token", async done => {
      try {
        await UserManager.verifyEmailToken({
          emailToken: ""
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* emailToken: Invalid token."
        );
        return done();
      }
      done("Should have thrown invalid token error.");
    });

    it("should handle email not found", async done => {
      try {
        await UserManager.verifyEmailToken({
          emailToken: "a:b@c.ca:tok3n"
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* emailToken: Email not found."
        );
        return done();
      }
      done("Should have thrown email not found error.");
    });

    it("should handle email already validated", async done => {
      await getConnection()
        .getRepository(UserEmail)
        .update("dupeuser2@udia.ca", { verified: true });
      try {
        await UserManager.verifyEmailToken({
          emailToken: "dupeuser2@udia.ca:test"
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* emailToken: Email already verified."
        );
        return done();
      }
      done("Should have thrown email already verified error.");
    });

    it("should handle invalid & expired secret", async done => {
      try {
        await UserManager.verifyEmailToken({
          emailToken: "verifyemailuser@udia.ca:tok3n"
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          `The request is invalid.\n` +
            `* emailToken: Token is expired.\n` +
            `* emailToken: Invalid secret.`
        );
        return done();
      }
      done("Should have thrown invalid & expired secret error.");
    });
  });

  describe("sendForgotPasswordEmail", () => {
    it("should handle invalid email", async done => {
      try {
        await UserManager.sendForgotPasswordEmail({
          email: ""
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* email: Email not found."
        );
        return done();
      }
      done("Should have thrown email not found error.");
    });

    it("should send an password reset email", async () => {
      expect.assertions(1);
      await expect(
        UserManager.sendForgotPasswordEmail({
          email: "dupeUser2@udia.ca"
        })
      ).resolves.toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("should handle invalid token", async done => {
      try {
        await UserManager.resetPassword({
          resetToken: "",
          newPw: "",
          pwFunc: "",
          pwDigest: "",
          pwCost: 1,
          pwKeySize: 1,
          pwSalt: ""
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* resetToken: Invalid token."
        );
        return done();
      }
      done("Should have thrown invalid token error.");
    });

    it("should handle user not found", async done => {
      try {
        await UserManager.resetPassword({
          resetToken: "badActor:tok3n",
          newPw: "",
          pwFunc: "",
          pwDigest: "",
          pwCost: 1,
          pwKeySize: 1,
          pwSalt: ""
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          "The request is invalid.\n* resetToken: User not found."
        );
        return done();
      }
      done("Should have thrown user not found error.");
    });

    it("should handle invalid & expired secret", async done => {
      try {
        await UserManager.resetPassword({
          resetToken: "verifyemailuser:tok3n",
          newPw: "",
          pwFunc: "",
          pwDigest: "",
          pwCost: 1,
          pwKeySize: 1,
          pwSalt: ""
        });
      } catch (err) {
        expect(err).toHaveProperty(
          "message",
          `The request is invalid.\n` +
            `* resetToken: Token is expired.\n` +
            `* resetToken: Invalid secret.`
        );
        return done();
      }
      done("Should have thrown invalid & expired secret error.");
    });
  });

  describe("checkResetToken", () => {
    it("should handle invalid token", async () => {
      expect.assertions(1);
      const payload = await UserManager.checkResetToken("");
      expect(payload).toEqual({ isValid: false, expiry: null });
    });

    it("should handle user not found", async () => {
      expect.assertions(1);
      const payload = await UserManager.checkResetToken("badActor:tok3n");
      expect(payload).toEqual({ isValid: false, expiry: null });
    });
  });

  describe("emailExists", () => {
    it("should handle invalid email", async () => {
      expect.assertions(5);
      await expect(UserManager.emailExists()).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n* email: Email is invalid.`
      );
      await expect(UserManager.emailExists("")).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n* email: Email is invalid.`
      );
      await expect(UserManager.emailExists(null)).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n* email: Email is invalid.`
      );
      await expect(UserManager.emailExists(undefined)).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n* email: Email is invalid.`
      );
      await expect(UserManager.emailExists("badstring")).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n* email: Email is invalid.`
      );
    });
  });

  describe("usernameExists", async () => {
    it("should handle invalid usernames", async () => {
      expect.assertions(5);
      await expect(UserManager.usernameExists()).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* username: Username is too short (under 3 characters).`
      );
      await expect(UserManager.usernameExists("")).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* username: Username is too short (under 3 characters).`
      );
      await expect(UserManager.usernameExists(null)).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* username: Username is too short (under 3 characters).`
      );
      await expect(
        UserManager.usernameExists(undefined)
      ).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* username: Username is too short (under 3 characters).`
      );
      await expect(
        UserManager.usernameExists("somereallylongusernameisgoinghere")
      ).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* username: Username is too long (over 24 characters).`
      );
    });
  });
});
