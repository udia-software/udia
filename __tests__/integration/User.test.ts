import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { Server } from "http";
import { getConnection } from "typeorm";
import { PORT } from "../../src/constants";
import { User } from "../../src/entity/User";
import start from "../../src/index";
import Auth from "../../src/modules/Auth";
import {
  generateKeyPairECDH,
  generateUserCryptoParams,
  loginUserCryptoParams
} from "../testHelper";

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
  // userInputtedPassword = `Another secure p455word~`;
  const lmUser = new User();
  lmUser.username = "loginMe";
  lmUser.email = "loginme@udia.ca";
  lmUser.password = `$argon2i$v=19$m=4096,t=3,p=1$oQsV2gDZcl3Qx2dfn+4hmg$2eeavsqCtG5zZRCQ/lVFSjrayzkmQGbdGYEi+p+Ny9w`;
  lmUser.pwFunc = "pbkdf2";
  lmUser.pwDigest = "sha512";
  lmUser.pwCost = 3000;
  lmUser.pwSalt = "c9b5f819984f9f2ef18ec4c4156dbbc802c79d11";
  await getConnection().manager.save(lmUser);
  const umUser = new User();
  umUser.username = "updateMe";
  umUser.email = "updateme@udia.ca";
  umUser.password = `$argon2i$v=19$m=4096,t=3,p=1$J80klk+fZ4DZvxParIpdPQ$3GxiZIpzlE7KYkYC9chP3/2VYUaJNHpqKTNrIM+LBUQ`;
  umUser.pwFunc = "pbkdf2";
  umUser.pwDigest = "sha512";
  umUser.pwCost = 3000;
  umUser.pwSalt = "066c1fb06d3488df129bf476dfa6e58e6223293d";
  await getConnection().manager.save(umUser);
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

    it("should perform server side hash/verify", async done => {
      const hashedPasswordStub = `695e4761dd4694a3a475243f202ea7239ff9f57fac`;
      const hash = await Auth.hashPassword(hashedPasswordStub);
      expect(await Auth.verifyPassword(hash, hashedPasswordStub)).toBe(true);
      done();
    });

    it("should generate valid public/private key pair", () => {
      const {
        ecdh: a,
        publicKey: aPub,
        privateKey: aPriv
      } = generateKeyPairECDH();
      const {
        ecdh: b,
        publicKey: bPub,
        privateKey: bPriv
      } = generateKeyPairECDH();
      // console.log(a, aPub, aPriv)
      // console.log(b, bPub, bPriv)
      // Exchange and generate the secret...
      const aliceSecret = a.computeSecret(bPub, "hex");
      const bobSecret = b.computeSecret(aPub, "hex");
      // console.log(aliceSecret.toString("hex"));
      // console.log(bobSecret.toString("hex"));
      expect(aliceSecret.toString("hex")).toEqual(bobSecret.toString("hex"));
    });
  });

  describe("REST API", () => {
    it("should create a user.", async done => {
      const username = "createMe";
      const email = "createMe@udia.ca";
      const userInputtedPassword = `My secure p455word!`;
      // const username = "updateMe";
      // const email = "updateMe@udia.ca";
      // const userInputtedPassword = `Another secure p455word~`;
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
      const uip = `Another secure p455word~`;
      const newUip = `Changed secure p455w3rd;`;
      const getAuthParamsResp = await restClient.get("/auth/params", {
        params: { email }
      });
      const { pwCost, pwSalt, pwFunc, pwDigest } = getAuthParamsResp.data;
      const old = loginUserCryptoParams(uip, pwCost, pwSalt, pwFunc, pwDigest);
      const postAuthSigninResp = await restClient.post("/auth/sign_in", {
        email,
        pw: old.pw
      });
      const jwt: string = postAuthSigninResp.data.jwt;
      const n = loginUserCryptoParams(newUip, pwCost, pwSalt, pwFunc, pwDigest);
      const patchAuthResp = await restClient.patch(
        "/auth",
        { newPw: n.pw, pw: old.pw },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      expect(patchAuthResp.status).toEqual(204);
      const changedPostAuthSigninResp = await restClient.post("/auth/sign_in", {
        email,
        pw: n.pw
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
