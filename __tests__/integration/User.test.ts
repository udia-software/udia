import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { Server } from "http";
import { getConnection } from "typeorm";
import { PORT } from "../../src/constants";
import { User } from "../../src/entity/User";
import start from "../../src/index";
import Auth from "../../src/modules/Auth";
import { generateUserCryptoParams, loginUserCryptoParams } from "../testHelper";

let server: Server = null;
let restClient: AxiosInstance = null;

/**
 * Integration tests for User logic.
 * - Test REST API
 * - Test GraphQL API
 */
beforeAll(async done => {
  server = await start();
  restClient = axios.create({ baseURL: `http://0.0.0.0:${PORT}` });
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("username = :createMe", { createMe: "createMe" })
    .orWhere("username = :loginMe", { loginMe: "loginMe" })
    .orWhere("username = :updateMe", { updateMe: "updateMe" })
    .execute();
  const stubUser = new User();
  stubUser.username = "loginMe";
  stubUser.email = "loginme@udia.ca";
  // userInputtedPassword = `Another secure p455word~`;
  stubUser.password = `$argon2i$v=19$m=4096,t=3,p=1$oQsV2gDZcl3Qx2dfn+4hmg$2eeavsqCtG5zZRCQ/lVFSjrayzkmQGbdGYEi+p+Ny9w`;
  stubUser.pwFunc = "pbkdf2";
  stubUser.pwDigest = "sha512";
  stubUser.pwCost = 3000;
  stubUser.pwSalt = "c9b5f819984f9f2ef18ec4c4156dbbc802c79d11";
  await getConnection().manager.save(stubUser);
  const stub2User = new User();
  stub2User.username = "updateMe";
  stub2User.email = "updateme@udia.ca";
  stub2User.password = `$argon2i$v=19$m=4096,t=3,p=1$aB/tWN70qSUzENu4daWsQg$8Er6+T3izJEXroNIrWcqxoqYqF7KGq7KJoo+P00XLuU`;
  stub2User.pwFunc = "pbkdf2";
  stub2User.pwDigest = "sha512";
  stub2User.pwCost = 3000;
  stub2User.pwSalt = "c2675135ef44266d8b0a37758aa890bcc65cadbd";
  await getConnection().manager.save(stub2User);
  done();
});

afterAll(async done => {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("username = :createMe", { createMe: "createMe" })
    .orWhere("username = :loginMe", { loginMe: "loginMe" })
    .orWhere("username = :updateMe", { updateMe: "updateMe" })
    .execute();
  await server.close();
  done();
});

describe("Users", () => {
  describe("TestHelper", () => {
    it("should generate predictable parameters", () => {
      const email = "testHelper@udia.ca";
      const userInputtedPassword = "T3st1ing the Helper!";
      const {
        pw: upw,
        mk: umk,
        ak: uak,
        pwSalt,
        pwCost,
        pwFunc,
        pwDigest
      } = generateUserCryptoParams(email, userInputtedPassword);
      const { pw: lpw, mk: lmk, ak: lak } = loginUserCryptoParams(
        userInputtedPassword,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      );
      expect(upw).toEqual(lpw);
      expect(umk).toEqual(lmk);
      expect(uak).toEqual(lak);
    });

    it("should predictable perform server side hash/verify", async done => {
      const hashedPasswordStub = `695e4761dd4694a3a475243f202ea7239ff9f57fac`;
      const hash = await Auth.hashPassword(hashedPasswordStub);
      expect(await Auth.verifyPassword(hash, hashedPasswordStub)).toBe(true);
      done();
    });
  });

  describe("REST API", () => {
    it("should create a user.", async done => {
      const username = "createMe";
      const email = "createMe@udia.ca";
      const userInputtedPassword = `My secure p455word!`;
      const {
        pw,
        mk,
        ak,
        pwSalt,
        pwCost,
        pwFunc,
        pwDigest
      } = generateUserCryptoParams(email, userInputtedPassword);
      const postAuthResp = await restClient.post("/auth", {
        username,
        email,
        pw,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      });
      expect(postAuthResp.data).toHaveProperty("jwt");
      done();
    });

    it("should login a user.", async done => {
      const email = "loginMe@udia.ca";
      const userInputtedPassword = `Another secure p455word~`;

      const getAuthParamsResp = await restClient.get("/auth/params", {
        params: { email }
      });
      const { pwCost, pwSalt, pwFunc, pwDigest } = getAuthParamsResp.data;
      expect(pwFunc).toEqual("pbkdf2");
      expect(pwDigest).toEqual("sha512");
      expect(pwCost).toEqual(3000);
      const { pw } = loginUserCryptoParams(
        userInputtedPassword,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      );
      const postAuthSigninResp = await restClient.post("/auth/sign_in", {
        email,
        pw
      });
      expect(postAuthSigninResp.data).toHaveProperty("jwt");
      done();
    });

    it("should update a user's password.", async done => {
      const email = "updateMe@udia.ca";
      const userInputtedPassword = `Another secure p455word~`;
      const newUserPassword = `Changed secure p455w3rd;`;
      const getAuthParamsResp = await restClient.get("/auth/params", {
        params: { email }
      });
      const { pwCost, pwSalt, pwFunc, pwDigest } = getAuthParamsResp.data;
      const { pw } = loginUserCryptoParams(
        userInputtedPassword,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      );
      const postAuthSigninResp = await restClient.post("/auth/sign_in", {
        email,
        pw
      });
      const jwt: string = postAuthSigninResp.data.jwt;
      const { pw: newPw } = loginUserCryptoParams(
        newUserPassword,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest
      );
      const patchAuthResp = await restClient.patch(
        "/auth",
        { newPw, pw },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      expect(patchAuthResp.status).toEqual(204);
      const changedPostAuthSigninResp = await restClient.post("/auth/sign_in", {
        email,
        pw: newPw
      });
      expect(changedPostAuthSigninResp.data).toHaveProperty("jwt");
      done();
    });

    it("should delete a user.");
  });

  describe("GraphQL API", () => {
    it("should create a user.");
    it("should update a user.");
    it("should delete a user.");
  });
});
