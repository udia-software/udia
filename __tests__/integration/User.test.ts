import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { Server } from "http";
import { setTimeout } from "timers";
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
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = parseInt(PORT, 10) + 1;
  server = await start(userTestPort);
  restClient = axios.create({ baseURL: `http://0.0.0.0:${userTestPort}/api` });
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("username = :createMe", { createMe: "createMe" })
    .orWhere("username = :loginMe", { loginMe: "loginMe" })
    .orWhere("username = :updateMe", { updateMe: "updateMe" })
    .orWhere("username = :deleteMe", { deleteMe: "deleteMe" })
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
  const dmUser = new User();
  dmUser.username = "deleteMe";
  dmUser.email = "deleteme@udia.ca";
  dmUser.password = `$argon2i$v=19$m=4096,t=3,p=1$hPTFrhTQyLAQSQTbi1mgdw$8xQV92AaB8nmAXvgv5n9bCaoElCnseLh+n6Vefr3+Ds`;
  dmUser.pwFunc = "pbkdf2";
  dmUser.pwDigest = "sha512";
  dmUser.pwCost = 3000;
  dmUser.pwSalt = "2ae2691596ab7481fcf61e49e955db4fd36d9aca";
  await getConnection().manager.save(dmUser);
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
    .orWhere("username = :deleteMe", { deleteMe: "deleteMe" })
    .execute();
  await server.close();
  done();
});

describe("Users", () => {
  describe("REST API", () => {
    it("should create a user.", async done => {
      const username = "createMe";
      const email = "createMe@udia.ca";
      const userInputtedPassword = `My secure p455word!`;
      // const username = "deleteMe";
      // const email = "deleteMe@udia.ca";
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
      expect(postAuthResp.data).toHaveProperty("user");
      const user = postAuthResp.data.user;
      expect(user).toHaveProperty("uuid");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("password");
      expect(user).toHaveProperty("pwFunc");
      expect(user).toHaveProperty("pwDigest");
      expect(user).toHaveProperty("pwCost");
      expect(user).toHaveProperty("pwSalt");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
      const createdAt = new Date(user.createdAt).getTime();
      const updatedAt = new Date(user.updatedAt).getTime();
      expect(updatedAt).toEqual(createdAt);
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
      expect(postAuthSigninResp.data).toHaveProperty("user");
      const user = postAuthSigninResp.data.user;
      expect(user).toHaveProperty("uuid");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("password");
      expect(user).toHaveProperty("pwFunc");
      expect(user).toHaveProperty("pwDigest");
      expect(user).toHaveProperty("pwCost");
      expect(user).toHaveProperty("pwSalt");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
      const createdAt = new Date(user.createdAt).getTime();
      const updatedAt = new Date(user.updatedAt).getTime();
      expect(updatedAt).toEqual(createdAt);      done();
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
      const user = postAuthSigninResp.data.user;
      const oldCreatedAt = new Date(user.createdAt).getTime();
      const oldUpdatedAt = new Date(user.updatedAt).getTime();
      // await new Promise(res => setTimeout(res, 10)); // not necessary?
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
      expect(changedPostAuthSigninResp.data).toHaveProperty("user");
      const updatedUser: User = changedPostAuthSigninResp.data.user;
      expect(updatedUser.updatedAt).toBeDefined();
      const newCreatedAt = new Date(updatedUser.createdAt).getTime();
      const newUpdatedAt = new Date(updatedUser.updatedAt).getTime();
      expect(newUpdatedAt).toBeGreaterThan(newCreatedAt);
      expect(newCreatedAt).toEqual(oldCreatedAt);
      expect(oldUpdatedAt).toBeLessThan(newUpdatedAt);
      done();
    });

    it("should delete a user.", async done => {
      const email = "deleteMe@udia.ca";
      const uip = `Another secure p455word~`;
      const getAuthParamsResp = await restClient.get("/auth/params", {
        params: { email }
      });
      const { pwCost, pwSalt, pwFunc, pwDigest } = getAuthParamsResp.data;
      const keys = loginUserCryptoParams(uip, pwCost, pwSalt, pwFunc, pwDigest);
      const postAuthSigninResp = await restClient.post("/auth/sign_in", {
        email,
        pw: keys.pw
      });
      const jwt: string = postAuthSigninResp.data.jwt;
      const deleteAuthResp = await restClient.delete("/auth", {
        headers: { Authorization: `Bearer ${jwt}` },
        data: { pw: keys.pw }
      });
      expect(deleteAuthResp.status).toEqual(204);
      done();
    });
  });

  describe("GraphQL API", () => {
    it("should create a user.");
    it("should update a user.");
    it("should delete a user.");
  });
});
