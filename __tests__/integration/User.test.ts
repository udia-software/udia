import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient, ApolloClientOptions } from "apollo-client";
import { ApolloLink, split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getOperationDefinition } from "apollo-utilities";
import { OperationDefinitionNode } from "graphql";
import gql from "graphql-tag";
import { Server } from "http";
import fetch from "node-fetch";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { setTimeout } from "timers";
import { getConnection } from "typeorm";
import WebSocket from "ws";
import { PORT } from "../../src/constants";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import start from "../../src/index";
import Auth from "../../src/modules/Auth";
import {
  generateKeyPairECDH,
  generateUserCryptoParams,
  loginUserCryptoParams
} from "../testHelper";

let server: Server = null;
let gqlClient: ApolloClient<any> = null;
let subscriptionClient: SubscriptionClient = null;

async function createUsers() {
  // userInputtedPassword = `Another secure p455word~`;
  await getConnection().transaction(async transactionEntityManager => {
    let lmUser = new User();
    const lmEmail = new UserEmail();
    lmEmail.email = "loginMe@udia.ca";
    lmEmail.lEmail = "loginme@udia.ca";
    lmEmail.primary = true;
    lmEmail.verified = true;
    lmUser.username = "loginMe";
    lmUser.lUsername = "loginme";
    lmUser.pwHash =
      `$argon2i$v=19$m=4096,t=3,p=1$` +
      `oQsV2gDZcl3Qx2dfn+4hmg$2eeavsqCtG5zZRCQ/lVFSjrayzkmQGbdGYEi+p+Ny9w`;
    lmUser.pwFunc = "pbkdf2";
    lmUser.pwDigest = "sha512";
    lmUser.pwCost = 3000;
    lmUser.pwSalt = "c9b5f819984f9f2ef18ec4c4156dbbc802c79d11";
    lmUser = await transactionEntityManager.save(lmUser);
    lmEmail.user = lmUser;
    await transactionEntityManager.save(lmEmail);

    let umUser = new User();
    const umEmail = new UserEmail();
    umEmail.email = "updateMe@udia.ca";
    umEmail.lEmail = "updateme@udia.ca";
    umEmail.primary = true;
    umEmail.verified = false;
    umUser.username = "updateMe";
    umUser.lUsername = "updateme";
    umUser.pwHash =
      `$argon2i$v=19$m=4096,t=3,p=1` +
      `$J80klk+fZ4DZvxParIpdPQ$3GxiZIpzlE7KYkYC9chP3/2VYUaJNHpqKTNrIM+LBUQ`;
    umUser.pwFunc = "pbkdf2";
    umUser.pwDigest = "sha512";
    umUser.pwCost = 3000;
    umUser.pwSalt = "066c1fb06d3488df129bf476dfa6e58e6223293d";
    umUser = await transactionEntityManager.save(umUser);
    umEmail.user = umUser;
    await transactionEntityManager.save(umEmail);
  });
}

async function deleteUsers() {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("username = :createMe", { createMe: "createMe" })
    .orWhere("username = :loginMe", { loginMe: "loginMe" })
    .orWhere("username = :updateMe", { updateMe: "updateMe" })
    .execute();
}

/**
 * Integration tests for User logic.
 * - Test REST API
 * - Test GraphQL API
 */
beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = parseInt(PORT, 10) + 1;
  server = await start(userTestPort);
  const GRAPHQL_HTTP_ENDPOINT = `http://0.0.0.0:${userTestPort}/graphql`;
  const GRAPHQL_SUBSCRIPTIONS_ENDPOINT = `ws://0.0.0.0:${userTestPort}/subscriptions`;

  // On the client, this should pull from Local Storage.
  // Here, hard code update user's jwt (which expires in the distant future)
  const jwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVwZGF0ZU1lIiwiaWF" +
    "0IjoxNTIzNTkwMjcyLCJuYmYiOjE1MjM1OTAyNzIsImV4cCI6MTM0NTM4ODc0MjcyfQ.Sk0l" +
    "0409H5ScaHL5roOiVo4QBgxa0z-nQj9nZKF2Cv4";
  const authorizationHeader = jwt ? `Bearer ${jwt}` : "";
  const middlewareAuthLink = new ApolloLink((operation, forward) => {
    operation.setContext({ headers: { authorization: authorizationHeader } });
    return forward(operation);
  });
  const httpLinkWithAuthToken = middlewareAuthLink.concat(
    new HttpLink({ uri: GRAPHQL_HTTP_ENDPOINT, fetch })
  );

  subscriptionClient = new SubscriptionClient(
    GRAPHQL_SUBSCRIPTIONS_ENDPOINT,
    {
      reconnect: true,
      connectionParams: { authorization: authorizationHeader }
    },
    WebSocket
  );
  const wsLinkWithAuthToken = new WebSocketLink(subscriptionClient);
  const link = split(
    ({ query }) => {
      const { kind, operation } = getOperationDefinition(query) || {
        kind: null,
        operation: null
      };
      return kind === "OperationDefinition" && operation === "subscription";
    },
    wsLinkWithAuthToken,
    httpLinkWithAuthToken
  );
  gqlClient = new ApolloClient({
    link,
    cache: new InMemoryCache()
  });
  await deleteUsers();
  await createUsers();
  done();
});

afterAll(async done => {
  await deleteUsers();
  await subscriptionClient.close();
  await server.close();
  done();
});

describe("Users", () => {
  describe("GraphQL API", () => {
    it("should create a user.", async done => {
      const username = "createMe";
      const email = "createMe@udia.ca";
      const userInputtedPassword = "My Super S3C$^T P~!۩s";
      // const username = "dupeUser";
      // const email = "dupeUser@udia.ca";
      // const userInputtedPassword = "Dupe S3C$^T P~!۩s";
      const {
        pw,
        mk,
        ak,
        pwSalt,
        pwCost,
        pwFunc,
        pwDigest,
        pwKeySize
      } = generateUserCryptoParams(email, userInputtedPassword);
      const createUserMutationResp = await gqlClient.mutate({
        mutation: gql`
          mutation CreateNewUser(
            $username: String!
            $email: String!
            $pw: String!
            $pwCost: Int!
            $pwSalt: String!
            $pwFunc: String!
            $pwDigest: String!
            $pwKeySize: Int!
          ) {
            createUser(
              username: $username
              email: $email
              pw: $pw
              pwCost: $pwCost
              pwSalt: $pwSalt
              pwFunc: $pwFunc
              pwDigest: $pwDigest
              pwKeySize: $pwKeySize
            ) {
              jwt
              user {
                uuid
                username
                emails {
                  email
                  user {
                    uuid
                  }
                  primary
                  verified
                }
                pwHash
                pwFunc
                pwDigest
                pwCost
                pwKeySize
                pwSalt
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: {
          username,
          email,
          pw,
          pwCost,
          pwSalt,
          pwFunc,
          pwDigest,
          pwKeySize
        }
      });
      expect(createUserMutationResp).toHaveProperty("data");
      const createUserMutationRespData = createUserMutationResp.data;
      expect(createUserMutationRespData).toHaveProperty("createUser");
      const createUserData = createUserMutationRespData.createUser;
      expect(createUserData).toHaveProperty("__typename", "UserAuthPayload");
      expect(createUserData).toHaveProperty("jwt");
      // expect(createUserData).toHaveProperty("jwt", "");
      expect(createUserData).toHaveProperty("user");
      const createdUser = createUserData.user;
      expect(createdUser).toHaveProperty("__typename", "FullUser");
      expect(createdUser).toHaveProperty("createdAt");
      expect(createdUser).toHaveProperty("pwHash");
      expect(createdUser).toHaveProperty("pwCost", pwCost);
      expect(createdUser).toHaveProperty("pwSalt", pwSalt);
      expect(createdUser).toHaveProperty("pwDigest", pwDigest);
      expect(createdUser).toHaveProperty("pwKeySize", pwKeySize);
      expect(createdUser).toHaveProperty("pwFunc", pwFunc);
      expect(createdUser).toHaveProperty("username", username);
      expect(createdUser).toHaveProperty("uuid");
      expect(createdUser).toHaveProperty("emails");
      expect(createdUser).toHaveProperty("createdAt");
      expect(createdUser).toHaveProperty("updatedAt");
      const createdUserEmails = createdUser.emails;
      expect(createdUserEmails).toHaveLength(1);
      const createdUserEmail = createdUserEmails[0];
      expect(createdUserEmail).toHaveProperty("__typename", "UserEmail");
      expect(createdUserEmail).toHaveProperty("email", email);
      expect(createdUserEmail).toHaveProperty("primary", true);
      expect(createdUserEmail).toHaveProperty("verified", false);
      expect(createdUserEmail).toHaveProperty("user");
      expect(createdUserEmail.user.uuid).toEqual(createdUser.uuid);
      done();
    });

    it("should login a user.", async done => {
      const email = "loginMe@udia.ca";
      const uip = `Another secure p455word~`;

      const getAuthParamsQueryResponse = await gqlClient.query({
        query: gql`
          query GetUserAuthParams($email: String!) {
            getUserAuthParams(email: $email) {
              pwFunc
              pwDigest
              pwCost
              pwKeySize
              pwSalt
            }
          }
        `,
        variables: { email }
      });
      expect(getAuthParamsQueryResponse).toHaveProperty("data");
      const getAuthParamsQueryData: any = getAuthParamsQueryResponse.data;
      expect(getAuthParamsQueryData).toHaveProperty("getUserAuthParams");
      const getUserAuthParams = getAuthParamsQueryData.getUserAuthParams;
      expect(getUserAuthParams).toHaveProperty("pwFunc");
      expect(getUserAuthParams).toHaveProperty("pwDigest");
      expect(getUserAuthParams).toHaveProperty("pwCost");
      expect(getUserAuthParams).toHaveProperty("pwKeySize");
      expect(getUserAuthParams).toHaveProperty("pwSalt");
      const { pwFunc, pwDigest, pwCost, pwKeySize, pwSalt } = getUserAuthParams;
      const { pw } = loginUserCryptoParams({
        uip,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest,
        pwKeySize
      });

      const signInUserMutationResponse = await gqlClient.mutate({
        mutation: gql`
          mutation SignInUser($email: String!, $pw: String!) {
            signInUser(email: $email, pw: $pw) {
              jwt
              user {
                uuid
                username
                emails {
                  email
                  user {
                    uuid
                  }
                }
              }
            }
          }
        `,
        variables: { email, pw }
      });

      expect(signInUserMutationResponse).toHaveProperty("data");
      const signInUserMutationData = signInUserMutationResponse.data;
      expect(signInUserMutationData).toHaveProperty("signInUser");
      const signInUser = signInUserMutationData.signInUser;
      expect(signInUser).toHaveProperty("__typename", "UserAuthPayload");
      expect(signInUser).toHaveProperty("jwt");
      expect(signInUser).toHaveProperty("user");
      const user = signInUser.user;
      expect(user).toHaveProperty("__typename", "FullUser");
      expect(user).toHaveProperty("uuid");
      expect(user).toHaveProperty("username", "loginMe");
      expect(user).toHaveProperty("emails");
      const emails = user.emails;
      expect(emails).toHaveLength(1);
      const userEmail = emails[0];
      expect(userEmail).toHaveProperty("__typename", "UserEmail");
      expect(userEmail).toHaveProperty("email", email);
      expect(userEmail).toHaveProperty("user");
      const emailUser = userEmail.user;
      expect(emailUser).toHaveProperty("__typename", "FullUser");
      expect(emailUser).toHaveProperty("uuid", user.uuid);
      done();
    });

    it("should update a user's password then delete a user.", async done => {
      const email = "updateMe@udia.ca";
      const uip = `Another secure p455word~`;
      const pwFunc = "pbkdf2";
      const pwDigest = "sha512";
      let pwCost = 3000;
      const pwKeySize = 768;
      let pwSalt = "066c1fb06d3488df129bf476dfa6e58e6223293d";
      const { pw } = loginUserCryptoParams({
        uip,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest,
        pwKeySize
      });
      pwCost = 3001;
      pwSalt = "09b5f819982f9f2ef18ec3b4156dbbc802c79d11";
      const { pw: newPw } = loginUserCryptoParams({
        uip,
        pwCost,
        pwSalt,
        pwFunc,
        pwDigest,
        pwKeySize
      });

      const updatePasswordMutationResponse = await gqlClient.mutate({
        mutation: gql`
          mutation UpdatePassword(
            $newPw: String!
            $pw: String!
            $pwFunc: String!
            $pwDigest: String!
            $pwCost: Int!
            $pwKeySize: Int!
            $pwSalt: String!
          ) {
            updatePassword(
              newPw: $newPw
              pw: $pw
              pwFunc: $pwFunc
              pwDigest: $pwDigest
              pwCost: $pwCost
              pwKeySize: $pwKeySize
              pwSalt: $pwSalt
            ) {
              uuid
              username
              pwSalt
              pwCost
              createdAt
              updatedAt
            }
          }
        `,
        variables: { newPw, pw, pwFunc, pwDigest, pwCost, pwKeySize, pwSalt }
      });
      expect(updatePasswordMutationResponse).toHaveProperty("data");
      const updatePasswordMutationData = updatePasswordMutationResponse.data;
      expect(updatePasswordMutationData).toHaveProperty("updatePassword");
      const updatePassword = updatePasswordMutationData.updatePassword;
      expect(updatePassword).toHaveProperty("__typename", "FullUser");
      expect(updatePassword).toHaveProperty("username", "updateMe");
      expect(updatePassword).toHaveProperty("pwSalt", pwSalt);
      expect(updatePassword).toHaveProperty("pwCost", pwCost);
      expect(updatePassword).toHaveProperty("createdAt");
      expect(updatePassword).toHaveProperty("updatedAt");
      const { createdAt, updatedAt } = updatePassword;
      expect(updatedAt).toBeGreaterThan(createdAt);

      const deleteUserMutationResponse = await gqlClient.mutate({
        mutation: gql`
          mutation DeleteUser($pw: String!) {
            deleteUser(pw: $pw)
          }
        `,
        variables: { pw: newPw }
      });
      expect(deleteUserMutationResponse).toEqual({
        data: { deleteUser: true }
      });
      done();
    });
  });
});
