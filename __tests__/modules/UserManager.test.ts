import { Server } from "http";
import { getConnection } from "typeorm";
import start from "../../src";
import { PORT } from "../../src/constants";
import { Item } from "../../src/entity/Item";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import Mailer from "../../src/mailer";
import ItemManager from "../../src/modules/ItemManager";
import UserManager from "../../src/modules/UserManager";
import { generateGenericUser, generateUserCryptoParams } from "../testHelper";

describe("UserManager", () => {
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = `${parseInt(PORT, 10) + 3}`;
  let server: Server;

  async function deleteValues() {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(User)
      .where({ lUsername: "badactor" })
      .orWhere("lUsername = :fuUser", { fuUser: "findusername" })
      .orWhere("lUsername = :dupeUser", { dupeUser: "dupeuser" })
      .orWhere("lUsername = :shrugUser", { shrugUser: "¯\\_(ツ)_/¯" })
      .orWhere("lUsername = :upUser", { upUser: "updatepassuser" })
      .orWhere("lUsername = :siUser", { siUser: "signinuser" })
      .orWhere("lUsername = :aeUser", { aeUser: "addemailuser" })
      .orWhere("lUsername = :reUser", { reUser: "removeemailuser" })
      .orWhere("lUsername = :spUser", { spUser: "setpemailuser" })
      .orWhere("lUsername = :delUser", { delUser: "delmeuser" })
      .orWhere("lUsername = :sveUser", { sveUser: "sendvemailuser" })
      .orWhere("lUsername = :veUser", { veUser: "verifyemailuser" })
      .orWhere("lUsername = :fpUser", { fpUser: "forgotpassuser" })
      .orWhere("lUsername = :rpUser", { rpUser: "resetpassuser" })
      .orWhere("lUsername = :itemUser", { itemUser: "itemuser" })
      .execute();
  }

  beforeAll(async () => {
    server = await start(userTestPort);
    await deleteValues();
  });

  afterAll(async done => {
    await deleteValues();
    server.close(done);
  });

  describe("getUserByUsername", () => {
    let findUNUser: User;
    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("findUsername");
        findUNUser = await transactionEntityManager.save(u);
        e.user = findUNUser;
        await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(findUNUser);
    });

    it("should handle no username supplied", async () => {
      expect.assertions(1);
      const user = await UserManager.getUserByUsername();
      expect(user).toBeUndefined();
    });

    it("should handle blank username supplied", async () => {
      expect.assertions(1);
      const user = await UserManager.getUserByUsername("");
      expect(user).toBeUndefined();
    });

    it("should handle invalid username supplied", async () => {
      expect.assertions(1);
      const user = await UserManager.getUserByUsername("unknown");
      expect(user).toBeUndefined();
    });
  });

  describe("createUser", () => {
    let dupeUser: User;
    let dupeUserEmail: UserEmail;
    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("dupeUser");
        dupeUser = await transactionEntityManager.save(u);
        e.user = dupeUser;
        dupeUserEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(dupeUser);
    });

    it("should handle username or email is taken", async () => {
      expect.assertions(1);
      return expect(
        UserManager.createUser({
          username: ` ${dupeUser.username}`,
          email: `${dupeUserEmail.email} `,
          pw: "tempbadpass",
          pwFunc: "pbkdf2",
          pwDigest: "sha512",
          pwCost: 3000,
          pwKeySize: 768,
          pwSalt: "salt",
          pubSignKey: JSON.stringify({ dummy: "key" }),
          encPrivSignKey: "dummykey",
          encSecretKey: "dummykey",
          pubEncKey: JSON.stringify({ dummy: "key" }),
          encPrivEncKey: "dummykey"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n" +
          "* username: Username is taken.\n" +
          "* email: Email is taken."
      );
    });

    it("should handle username too long", async () => {
      expect.assertions(1);
      return expect(
        UserManager.createUser({
          username: "somelongusernamehere12345",
          email: "somelongusernamehere12345@udia.ca",
          pw: "tempbadpass",
          pwFunc: "pbkdf2",
          pwDigest: "sha512",
          pwCost: 3000,
          pwKeySize: 768,
          pwSalt: "salt",
          pubSignKey: JSON.stringify({ dummy: "key" }),
          encPrivSignKey: "dummykey",
          encSecretKey: "dummykey",
          pubEncKey: JSON.stringify({ dummy: "key" }),
          encPrivEncKey: "dummykey"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n" +
          "* username: Username is too long (over 24 characters)."
      );
    });

    it("should handle username too short", async () => {
      expect.assertions(1);
      return expect(
        UserManager.createUser({
          username: "na",
          email: "na@udia.ca",
          pw: "tempbadpass",
          pwFunc: "pbkdf2",
          pwDigest: "sha512",
          pwCost: 3000,
          pwKeySize: 768,
          pwSalt: "salt",
          pubSignKey: JSON.stringify({ dummy: "key" }),
          encPrivSignKey: "dummykey",
          encSecretKey: "dummykey",
          pubEncKey: JSON.stringify({ dummy: "key" }),
          encPrivEncKey: "dummykey"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n" +
          "* username: Username is too short (under 3 characters)."
      );
    });

    it("should handle weak proof of secret", async () => {
      expect.assertions(1);
      return expect(
        UserManager.createUser({
          username: "nanana",
          email: "nanana@udia.ca",
          pw: "wkpw",
          pwFunc: "pbkdf2",
          pwDigest: "sha512",
          pwCost: 3000,
          pwKeySize: 768,
          pwSalt: "salt",
          pubSignKey: JSON.stringify({ dummy: "key" }),
          encPrivSignKey: "dummykey",
          encSecretKey: "dummykey",
          pubEncKey: JSON.stringify({ dummy: "key" }),
          encPrivEncKey: "dummykey"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* pw: Invalid password."
      );
    });

    it("should handle unicode usernames", async () => {
      expect.assertions(4);
      const shrugUser = await UserManager.createUser({
        username: "¯\\_(ツ)_/¯",
        email: "shrug@udia.ca",
        pw: "tempbadpass",
        pwFunc: "pbkdf2",
        pwDigest: "sha512",
        pwCost: 3000,
        pwKeySize: 768,
        pwSalt: "salt",
        pubSignKey: JSON.stringify({ dummy: "key" }),
        encPrivSignKey: "dummykey",
        encSecretKey: "dummykey",
        pubEncKey: JSON.stringify({ dummy: "key" }),
        encPrivEncKey: "dummykey"
      });
      expect(shrugUser).toHaveProperty("jwt");
      expect(shrugUser).toHaveProperty("user");
      const user = shrugUser.user;
      expect(user).toHaveProperty("lUsername", "¯\\_(ツ)_/¯");
      expect(user).toHaveProperty("username", "¯\\_(ツ)_/¯");
    });
  });

  describe("updatePassword", () => {
    let updatePassUser: User;
    let updatePassEmail: UserEmail;
    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("updatePassUser");
        updatePassUser = await transactionEntityManager.save(u);
        e.user = updatePassUser;
        updatePassEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(updatePassUser);
    });

    it("should handle password update invalid jwt", async () => {
      expect.assertions(1);
      const {
        pw,
        mk: newPw,
        pwFunc,
        pwDigest,
        pwCost,
        pwKeySize,
        pwSalt,
        encPrivSignKey,
        encSecretKey,
        encPrivEncKey
      } = generateUserCryptoParams("badActor@udia.ca", "Dupe S3C$^T P~!۩s");
      return expect(
        UserManager.updatePassword("unknown", {
          newPw,
          pw,
          pwFunc,
          pwDigest,
          pwCost,
          pwKeySize,
          pwSalt,
          encPrivSignKey,
          encSecretKey,
          encPrivEncKey
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle password update invalid password", async () => {
      expect.assertions(1);
      const {
        pw,
        mk: newPw,
        pwFunc,
        pwDigest,
        pwCost,
        pwKeySize,
        pwSalt,
        encPrivSignKey,
        encSecretKey,
        encPrivEncKey
      } = generateUserCryptoParams(updatePassEmail.email, "Dupe S3C$^T P~!۩s");
      return expect(
        UserManager.updatePassword(updatePassUser.lUsername, {
          newPw,
          pw: `b${pw}d`,
          pwFunc,
          pwDigest,
          pwCost,
          pwKeySize,
          pwSalt,
          encPrivSignKey,
          encSecretKey,
          encPrivEncKey
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* pw: Invalid password."
      );
    });
  });

  describe("signInUser", () => {
    let siUser: User;
    let siEmail: UserEmail;
    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("signInUser");
        siUser = await transactionEntityManager.save(u);
        e.user = siUser;
        siEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(siUser);
    });

    it("should handle sign in email not found", async () => {
      expect.assertions(1);
      const { pw } = generateUserCryptoParams(
        "badActor@udia.ca",
        "Dupe S3C$^T P~!۩s"
      );
      return expect(
        UserManager.signInUser({ email: "badActor@udia.ca", pw })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Email not found."
      );
    });

    it("should handle sign in invalid password", async () => {
      expect.assertions(1);
      const { pw } = generateUserCryptoParams(
        siEmail.email,
        "Dupe S3C$^T P~!۩s"
      );
      return expect(
        UserManager.signInUser({
          email: siEmail.email,
          pw: `b${pw}d`
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* pw: Invalid password."
      );
    });
  });

  describe("addEmail", () => {
    let aeUser: User;
    let aeEmail: UserEmail;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("addEmailUser");
        aeUser = await transactionEntityManager.save(u);
        e.user = aeUser;
        aeEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(aeUser);
    });

    it("should handle add email invalid jwt", async () => {
      expect.assertions(1);
      return expect(
        UserManager.addEmail(undefined, { email: "badActor@udia.ca" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle add email email exists", async () => {
      expect.assertions(1);
      return expect(
        UserManager.addEmail(aeUser.username, { email: aeEmail.email })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Email is taken."
      );
    });
  });

  describe("removeEmail", () => {
    let reUser: User;
    let reEmail: UserEmail;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("removeEmailUser");
        reUser = await transactionEntityManager.save(u);
        e.user = reUser;
        reEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(reUser);
    });

    it("should handle remove email invalid jwt", async () => {
      expect.assertions(1);
      return expect(
        UserManager.removeEmail(undefined, { email: "badActor@udia.ca" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle remove invalid email", async () => {
      expect.assertions(1);
      return expect(
        UserManager.removeEmail(reUser.username, { email: "" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Invalid Email."
      );
    });

    it("should handle orphan user attempt", async () => {
      expect.assertions(1);
      return expect(
        UserManager.removeEmail(reUser.username, { email: reEmail.email })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Cannot orphan user."
      );
    });

    it("should handle switch primary email", async () => {
      expect.assertions(10);
      const reSwitchEmail: UserEmail = new UserEmail();
      reSwitchEmail.email = "switchRemoveEmail@udia.ca";
      reSwitchEmail.lEmail = "switchremoveemail@udia.ca";
      reSwitchEmail.verified = true;
      reSwitchEmail.user = reUser;
      await getConnection()
        .getRepository(UserEmail)
        .save(reSwitchEmail);

      let user = await UserManager.removeEmail(reUser.username, {
        email: reEmail.email
      });
      expect(user).toBeDefined();
      user = user!;
      expect(user).toHaveProperty("emails");
      expect(user.emails).toHaveLength(1);
      const userEmail = user.emails[0];
      expect(userEmail).toHaveProperty("email", reSwitchEmail.email);
      expect(userEmail).toHaveProperty("lEmail", reSwitchEmail.lEmail);
      expect(userEmail).toHaveProperty("primary", true);
      expect(userEmail).toHaveProperty("verified", true);
      expect(userEmail).toHaveProperty("verificationHash", null);
      expect(userEmail).toHaveProperty("createdAt", reSwitchEmail.createdAt);
      expect(userEmail).toHaveProperty("updatedAt");
    });
  });

  describe("setPrimaryEmail", () => {
    let spUser: User;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("setPEmailUser");
        spUser = await transactionEntityManager.save(u);
        e.user = spUser;
        await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(spUser);
    });

    it("should handle set primary email invalid JWT", async () => {
      expect.assertions(1);
      return expect(
        UserManager.setPrimaryEmail(undefined, {
          email: "badActor@udia.ca"
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle set primary invalid email", async () => {
      expect.assertions(1);
      return expect(
        UserManager.setPrimaryEmail(spUser.username, { email: "" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Invalid Email."
      );
    });

    it("should handle set primary email non verified", async () => {
      expect.assertions(1);
      const switchPEmail: UserEmail = new UserEmail();
      switchPEmail.email = "switchPrimaryEmail@udia.ca";
      switchPEmail.lEmail = "switchprimaryemail@udia.ca";
      switchPEmail.user = spUser;
      await getConnection()
        .getRepository(UserEmail)
        .save(switchPEmail);
      return expect(
        UserManager.setPrimaryEmail(spUser.username, {
          email: switchPEmail.email
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Email must be verified."
      );
    });
  });

  describe("deleteUser", () => {
    let delUser: User;
    let duEmail: UserEmail;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("delMeUser");
        delUser = await transactionEntityManager.save(u);
        e.user = delUser;
        duEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(delUser);
    });

    it("should handle delete user invalid jwt", async () => {
      expect.assertions(1);
      const { pw } = generateUserCryptoParams(
        "badActor@udia.ca",
        "Dupe S3C$^T P~!۩s"
      );
      return expect(
        UserManager.deleteUser(undefined, { pw })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* id: Invalid JWT."
      );
    });

    it("should handle delete user invalid password", async () => {
      const { pw } = generateUserCryptoParams(
        duEmail.email,
        "Dupe S3C$^T P~!۩s"
      );
      return expect(
        UserManager.deleteUser(delUser.username, { pw })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* pw: Invalid password."
      );
    });
  });

  describe("sendEmailVerification", () => {
    let sveUser: User;
    let sveEmail: UserEmail;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("sendVEmailUser");
        sveUser = await transactionEntityManager.save(u);
        e.user = sveUser;
        e.verified = false;
        sveEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(sveUser);
    });

    it("should handle invalid email", async () => {
      expect.assertions(1);
      return expect(
        UserManager.sendEmailVerification({ email: "" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Email not found."
      );
    });

    it("should send an email verification email", async () => {
      expect.assertions(1);
      const result = await UserManager.sendEmailVerification({
        email: sveEmail.email
      });
      expect(result).toBe(true);
    });
  });

  describe("verifyEmailToken", () => {
    let veUser: User;
    let veEmail: UserEmail;
    let uveEmail: UserEmail;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("verifyEmailUser");
        veUser = await transactionEntityManager.save(u);
        e.user = veUser;
        veEmail = await transactionEntityManager.save(e);
        uveEmail = new UserEmail();
        uveEmail.email = "unverifiedEmail@udia.ca";
        uveEmail.lEmail = "unverifiedemail@udia.ca";
        uveEmail.verificationExpiry = new Date();
        uveEmail.verificationHash = "$argon2i$v=1$m=1,t=1,p=1$101";
        await transactionEntityManager.save(uveEmail);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(veUser);
    });

    it("should handle invalid token", async () => {
      expect.assertions(1);
      return expect(
        UserManager.verifyEmailToken({ emailToken: "" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* emailToken: Invalid token."
      );
    });

    it("should handle email not found", async () => {
      expect.assertions(1);
      return expect(
        UserManager.verifyEmailToken({ emailToken: "a:b@c.ca:tok3n" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* emailToken: Email not found."
      );
    });

    it("should handle email already validated", async () => {
      expect.assertions(1);
      return expect(
        UserManager.verifyEmailToken({
          emailToken: `${veEmail.email}:anyval`
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* emailToken: Email already verified."
      );
    });

    it("should handle invalid & expired secret", async () => {
      expect.assertions(1);
      return expect(
        UserManager.verifyEmailToken({
          emailToken: `${uveEmail.lEmail}:tok3n`
        })
      ).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* emailToken: Token is expired.\n` +
          `* emailToken: Invalid secret.`
      );
    });
  });

  describe("sendForgotPasswordEmail", () => {
    let fpUser: User;
    let fpEmail: UserEmail;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("forgotPassUser");
        fpUser = await transactionEntityManager.save(u);
        e.user = fpUser;
        e.verified = false;
        fpEmail = await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(fpUser);
    });

    it("should handle invalid email", async () => {
      expect.assertions(1);
      return expect(
        UserManager.sendForgotPasswordEmail({ email: "" })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* email: Email not found."
      );
    });

    it("should send a password reset email", async () => {
      expect.assertions(1);
      const result = await UserManager.sendForgotPasswordEmail({
        email: fpEmail.email
      });
      expect(result).toBe(true);
    });
  });

  describe("resetPassword", () => {
    let rpUser: User;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("resetPassUser");
        rpUser = await transactionEntityManager.save(u);
        e.user = rpUser;
        await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(rpUser);
    });

    it("should handle invalid token", async () => {
      expect.assertions(1);
      return expect(
        UserManager.resetPassword({
          resetToken: "",
          newPw: "",
          pwFunc: "",
          pwDigest: "",
          pwCost: 1,
          pwKeySize: 1,
          pwSalt: "",
          pubSignKey: "",
          encPrivSignKey: "",
          encSecretKey: "",
          pubEncKey: "",
          encPrivEncKey: ""
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* resetToken: Invalid token."
      );
    });

    it("should handle user not found", async () => {
      expect.assertions(1);
      return expect(
        UserManager.resetPassword({
          resetToken: "badActor:tok3n",
          newPw: "",
          pwFunc: "",
          pwDigest: "",
          pwCost: 1,
          pwKeySize: 1,
          pwSalt: "",
          pubSignKey: "",
          encPrivSignKey: "",
          encSecretKey: "",
          pubEncKey: "",
          encPrivEncKey: ""
        })
      ).rejects.toHaveProperty(
        "message",
        "The request is invalid.\n* resetToken: User not found."
      );
    });

    it("should handle invalid & expired secret", async () => {
      expect.assertions(1);
      return expect(
        UserManager.resetPassword({
          resetToken: `${rpUser.lUsername}:tok3n`,
          newPw: "",
          pwFunc: "",
          pwDigest: "",
          pwCost: 1,
          pwKeySize: 1,
          pwSalt: "",
          pubSignKey: "",
          encPrivSignKey: "",
          encSecretKey: "",
          pubEncKey: "",
          encPrivEncKey: ""
        })
      ).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n` +
          `* resetToken: Token is expired.\n` +
          `* resetToken: Invalid secret.`
      );
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
      expect.assertions(4);
      await expect(UserManager.emailExists()).rejects.toHaveProperty(
        "message",
        `The request is invalid.\n* email: Email is invalid.`
      );
      await expect(UserManager.emailExists("")).rejects.toHaveProperty(
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

  describe("usernameExists", () => {
    it("should handle invalid usernames", async () => {
      expect.assertions(4);
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

  describe("getUserFromItem", () => {
    let itemUser: User;
    let item: Item;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("itemUser");
        itemUser = await transactionEntityManager.save(u);
        e.user = itemUser;
        await transactionEntityManager.save(e);
      });
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(Item)
        .delete(item);
    });

    it("should get a user from an item", async () => {
      expect.assertions(1);
      item = await ItemManager.createItem(itemUser.lUsername, {
        content: "Item User Test",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      const verifyUser = await UserManager.getUserFromItemId(item.uuid);
      expect(verifyUser).toEqual(itemUser);
    });
  });
});
