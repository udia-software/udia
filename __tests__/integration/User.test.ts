import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient, ApolloClientOptions } from "apollo-client";
import { ApolloLink, split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getOperationDefinition } from "apollo-utilities";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";
import { Server } from "http";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { setTimeout } from "timers";
import { getConnection } from "typeorm";
import { PORT } from "../../src/constants";
import { User } from "../../src/entity/User";
import { UserEmail } from "../../src/entity/UserEmail";
import start from "../../src/index";
import Mailer from "../../src/mailer";
import Auth from "../../src/modules/Auth";
import {
  deriveSubKeysFromUserInputPassword,
  generateGenericUser,
  generateGraphQLClients,
  generateKeyPairECDH,
  generateUserCryptoParams
} from "../testHelper";

describe("Users", () => {
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = `${parseInt(PORT, 10) + 1}`;
  let server: Server = null;

  async function deleteUsers() {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(User)
      .where("lUsername = :unknown", { unknown: "unknown" })
      .orWhere("lUsername = :emailExists", { emailExists: "emailexists" })
      .orWhere("lUsername = :unameExists", { unameExists: "usernameexists" })
      .orWhere("lUsername = :createUser", { createUser: "createuser" })
      .orWhere("lUsername = :authParams", { authParams: "authparams" })
      .orWhere("lUsername = :signIn", { signIn: "signintest" })
      .orWhere("lUsername = :meTest", { meTest: "metest" })
      .orWhere("lUsername = :addEmail", { addEmail: "addemail" })
      .orWhere("lUsername = :verifyEmail", { verifyEmail: "verifyemail" })
      .orWhere("lUsername = :primaryEmail", { primaryEmail: "primaryemail" })
      .orWhere("lUsername = :removeEmail", { removeEmail: "removeemail" })
      .execute();
  }

  /**
   * Integration tests for User logic.
   * - Test GraphQL API
   */
  beforeAll(async done => {
    server = await start(userTestPort);
    await deleteUsers();
    done();
  });

  afterAll(async done => {
    await deleteUsers();
    server.close(done);
  });

  describe("checkEmailExists", () => {
    let emailExistsUser: User = null;
    let emailExistsEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const query = gql`
      query CheckEmailExists($email: String!) {
        checkEmailExists(email: $email)
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("emailExists");
        emailExistsUser = await transactionEntityManager.save(u);
        e.user = emailExistsUser;
        emailExistsEmail = await transactionEntityManager.save(e);
      });
      const { s, g } = generateGraphQLClients(userTestPort);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(emailExistsUser);
      subscriptionClient.close();
    });

    it("should return 0 when an email does not exist.", async () => {
      expect.assertions(3);
      const unknownEmail = "unknown@udia.ca";
      const checkUnknownEmailExistsQuery = await gqlClient.query({
        query,
        variables: {
          email: unknownEmail
        }
      });
      expect(checkUnknownEmailExistsQuery).toHaveProperty("data");
      const checkUnknownEmailExistsQueryData: any =
        checkUnknownEmailExistsQuery.data;
      expect(checkUnknownEmailExistsQueryData).toHaveProperty(
        "checkEmailExists"
      );
      const checkUnknownEmailExists =
        checkUnknownEmailExistsQueryData.checkEmailExists;
      expect(checkUnknownEmailExists).toEqual(0);
    });

    it("should reject with graphql error when email is taken", async () => {
      expect.assertions(1);
      return expect(
        gqlClient.query({
          query,
          variables: {
            email: emailExistsEmail.email
          }
        })
      ).rejects.toHaveProperty(
        "message",
        `GraphQL error: The request is invalid.\n* email: Email is taken.`
      );
    });
  });

  describe("checkUsernameExists", () => {
    let usernameExistsUser: User = null;
    let usernameExistsEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const query = gql`
      query CheckUsernameExists($username: String!) {
        checkUsernameExists(username: $username)
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("usernameExists");
        usernameExistsUser = await transactionEntityManager.save(u);
        e.user = usernameExistsUser;
        usernameExistsEmail = await transactionEntityManager.save(e);
      });
      const { s, g } = generateGraphQLClients(userTestPort);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(usernameExistsUser);
      subscriptionClient.close();
    });

    it("should return 0 when username does not exist.", async () => {
      expect.assertions(3);
      const unknownUsername = "unknown";
      const checkUnknownUsernameExistsQuery = await gqlClient.query({
        query,
        variables: {
          username: unknownUsername
        }
      });
      expect(checkUnknownUsernameExistsQuery).toHaveProperty("data");
      const checkUnknownUsernameExistsQueryData: any =
        checkUnknownUsernameExistsQuery.data;
      expect(checkUnknownUsernameExistsQueryData).toHaveProperty(
        "checkUsernameExists"
      );
      const checkUnknownUsernameExists =
        checkUnknownUsernameExistsQueryData.checkUsernameExists;
      expect(checkUnknownUsernameExists).toEqual(0);
    });

    it("should reject with graphql error when username is taken", async () => {
      expect.assertions(1);
      return expect(
        gqlClient.query({
          query,
          variables: {
            username: usernameExistsUser.username
          }
        })
      ).rejects.toHaveProperty(
        "message",
        `GraphQL error: The request is invalid.\n` +
          `* username: Username is taken.`
      );
    });
  });

  describe("createUser", () => {
    let createTestUserID: string = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    let sendEmailVerificationSpy: jest.SpyInstance;
    const mutation = gql`
      mutation CreateNewUser(
        $username: String!
        $email: String!
        $pw: String!
        $pwCost: Int!
        $pwSalt: String!
        $pwFunc: String!
        $pwDigest: String!
        $pwKeySize: Int!
        $pubSignKey: String!
        $encPrivSignKey: String!
        $encSecretKey: String!
        $pubEncKey: String!
        $encPrivEncKey: String!
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
          pubSignKey: $pubSignKey
          encPrivSignKey: $encPrivSignKey
          encSecretKey: $encSecretKey
          pubEncKey: $pubEncKey
          encPrivEncKey: $encPrivEncKey
        ) {
          jwt
          user {
            uuid
            username
            pwFunc
            pwDigest
            pwCost
            pwKeySize
            pwSalt
            createdAt
            updatedAt
            pubSignKey
            encPrivSignKey
            encSecretKey
            pubEncKey
            encPrivEncKey
            emails {
              email
              user {
                uuid
              }
              primary
              verified
            }
          }
        }
      }
    `;

    beforeEach(() => {
      sendEmailVerificationSpy.mockReset();
    });

    beforeAll(async () => {
      const { s, g } = generateGraphQLClients(userTestPort);
      gqlClient = g;
      subscriptionClient = s;
      sendEmailVerificationSpy = jest.spyOn(Mailer, "sendEmailVerification");
    });

    afterAll(async () => {
      sendEmailVerificationSpy.mockClear();
      await getConnection()
        .getRepository(User)
        .delete(createTestUserID);
      subscriptionClient.close();
    });

    it("should create a user.", async () => {
      expect.assertions(30);
      const username = "createUser";
      const email = "createUser@udia.ca";
      const userInputtedPassword = "My Super S3C$^T P~!۩s"; // wow!
      const params = generateUserCryptoParams(email, userInputtedPassword);
      const {
        pw,
        pwSalt,
        pwCost,
        pwFunc,
        pwDigest,
        pwKeySize,
        pubSignKey,
        encPrivSignKey,
        encSecretKey,
        pubEncKey,
        encPrivEncKey
      } = params;
      // Even though this is a test, don't send the mk and ak values
      delete params.mk;
      delete params.ak;

      const createUserMutationResp = await gqlClient.mutate({
        mutation,
        variables: { username, email, ...params }
      });
      expect(createUserMutationResp).toHaveProperty("data");
      const createUserMutationData = createUserMutationResp.data;
      expect(createUserMutationData).toHaveProperty("createUser");

      const createUser = createUserMutationData.createUser;
      expect(createUser).toHaveProperty("__typename", "UserAuthPayload");
      expect(createUser).toHaveProperty("jwt");
      expect(createUser).toHaveProperty("user");

      const createdUser = createUser.user;
      expect(createdUser).toHaveProperty("__typename", "FullUser");
      expect(createdUser).toHaveProperty("uuid");
      createTestUserID = createdUser.uuid; // store for cleanup
      expect(createdUser).toHaveProperty("username", username);
      expect(createdUser).toHaveProperty("pwFunc", pwFunc);
      expect(createdUser).toHaveProperty("pwDigest", pwDigest);
      expect(createdUser).toHaveProperty("pwCost", pwCost);
      expect(createdUser).toHaveProperty("pwKeySize", pwKeySize);
      expect(createdUser).toHaveProperty("pwSalt", pwSalt);
      expect(createdUser).toHaveProperty("createdAt");
      expect(createdUser).toHaveProperty("updatedAt");
      expect(createdUser).toHaveProperty("pubSignKey", pubSignKey);
      expect(createdUser).toHaveProperty("encPrivSignKey", encPrivSignKey);
      expect(createdUser).toHaveProperty("encSecretKey", encSecretKey);
      expect(createdUser).toHaveProperty("pubEncKey", pubEncKey);
      expect(createdUser).toHaveProperty("encPrivEncKey", encPrivEncKey);
      expect(createdUser).toHaveProperty("emails");

      const createdUserEmails = createdUser.emails;
      expect(createdUserEmails).toHaveLength(1);
      const createdUserEmail = createdUserEmails[0];
      expect(createdUserEmail).toHaveProperty("__typename", "UserEmail");
      expect(createdUserEmail).toHaveProperty("email", email);
      expect(createdUserEmail).toHaveProperty("primary", true);
      expect(createdUserEmail).toHaveProperty("verified", false);
      expect(createdUserEmail).toHaveProperty("user");
      expect(createdUserEmail.user).toHaveProperty("__typename", "FullUser");
      expect(createdUserEmail.user.uuid).toEqual(createdUser.uuid);

      expect(sendEmailVerificationSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUserAuthParams", () => {
    let authParamsUser: User = null;
    let authParamsEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const query = gql`
      query GetUserAuthParams($email: String!) {
        getUserAuthParams(email: $email) {
          pwFunc
          pwDigest
          pwCost
          pwKeySize
          pwSalt
        }
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("authParams");
        authParamsUser = await transactionEntityManager.save(u);
        e.user = authParamsUser;
        authParamsEmail = await transactionEntityManager.save(e);
      });
      const { s, g } = generateGraphQLClients(userTestPort);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(authParamsUser);
      subscriptionClient.close();
    });

    it("should get a user's authentication parameters", async () => {
      expect.assertions(7);
      const getAuthParamsQueryResponse = await gqlClient.query({
        query,
        variables: { email: authParamsEmail.email }
      });
      const { pwFunc, pwDigest, pwCost, pwKeySize, pwSalt } = authParamsUser;

      expect(getAuthParamsQueryResponse).toHaveProperty("data");
      const getAuthParamsData: any = getAuthParamsQueryResponse.data;
      expect(getAuthParamsData).toHaveProperty("getUserAuthParams");
      const getUserAuthParams = getAuthParamsData.getUserAuthParams;
      expect(getUserAuthParams).toHaveProperty("pwFunc", pwFunc);
      expect(getUserAuthParams).toHaveProperty("pwDigest", pwDigest);
      expect(getUserAuthParams).toHaveProperty("pwCost", pwCost);
      expect(getUserAuthParams).toHaveProperty("pwKeySize", pwKeySize);
      expect(getUserAuthParams).toHaveProperty("pwSalt", pwSalt);
    });

    it("should reject with graphql error when email not found", async () => {
      expect.assertions(1);
      return expect(
        gqlClient.query({
          query,
          variables: {
            email: "unknown@udia.ca"
          }
        })
      ).rejects.toHaveProperty(
        "message",
        `GraphQL error: The request is invalid.\n* email: Email not found.`
      );
    });
  });

  describe("signInUser", () => {
    const testUserEmail = "signInTest@udia.ca";
    const testUserInputtedPassword = "signInTestPassword Test!^123";
    const {
      pw,
      pwSalt,
      pwCost,
      pwFunc,
      pwDigest,
      pwKeySize,
      pubSignKey,
      encPrivSignKey,
      encSecretKey,
      pubEncKey,
      encPrivEncKey
    } = generateUserCryptoParams(testUserEmail, testUserInputtedPassword);
    let signInTestUser: User = null;
    let signInEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const mutation = gql`
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
    `;

    beforeAll(async () => {
      const pwHash = await Auth.hashPassword(pw);
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("signInTest");
        u.pwHash = pwHash;
        // u.pwSalt = pwSalt;
        // u.pwCost = pwCost;
        // u.pwFunc = pwFunc;
        // u.pwDigest = pwDigest;
        // u.pwKeySize = pwKeySize;
        // u.pubSignKey = pubSignKey;
        // u.encPrivSignKey = encPrivEncKey;
        // u.encSecretKey = encSecretKey;
        // u.pubEncKey = pubEncKey;
        // u.encPrivEncKey = encPrivEncKey;
        signInTestUser = await transactionEntityManager.save(u);
        e.user = signInTestUser;
        signInEmail = await transactionEntityManager.save(e);
      });
      const { s, g } = generateGraphQLClients(userTestPort);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(signInTestUser);
      subscriptionClient.close();
    });

    it("should sign in a user.", async () => {
      expect.assertions(15);
      const signInUserMutationResponse = await gqlClient.mutate({
        mutation,
        variables: { email: testUserEmail, pw }
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
      expect(user).toHaveProperty("username", "signInTest");
      expect(user).toHaveProperty("emails");
      const emails = user.emails;
      expect(emails).toHaveLength(1);
      const userEmail = emails[0];
      expect(userEmail).toHaveProperty("__typename", "UserEmail");
      expect(userEmail).toHaveProperty("email", testUserEmail);
      expect(userEmail).toHaveProperty("user");
      const emailUser = userEmail.user;
      expect(emailUser).toHaveProperty("__typename", "FullUser");
      expect(emailUser).toHaveProperty("uuid", user.uuid);
    });
  });

  describe("me", () => {
    let meTestUser: User = null;
    let meTestEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const query = gql`
      query Me {
        me {
          uuid
          username
          emails {
            email
            user {
              uuid
            }
            primary
            verified
            createdAt
            updatedAt
          }
          pwFunc
          pwDigest
          pwCost
          pwKeySize
          pwSalt
          pubSignKey
          encPrivSignKey
          encSecretKey
          pubEncKey
          encPrivEncKey
          createdAt
          updatedAt
        }
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("meTest");
        meTestUser = await transactionEntityManager.save(u);
        e.user = meTestUser;
        meTestEmail = await transactionEntityManager.save(e);
      });
      const jwt = Auth.signUserJWT(meTestUser);
      const { s, g } = generateGraphQLClients(userTestPort, jwt);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(meTestUser);
      subscriptionClient.close();
    });

    it("should get a logged in user.", async () => {
      expect.assertions(28);
      const meQueryResponse = await gqlClient.query({ query });
      expect(meQueryResponse).toHaveProperty("data");
      const meQueryResponseData: any = meQueryResponse.data;
      expect(meQueryResponseData).toHaveProperty("me");
      const meData = meQueryResponseData.me;
      expect(meData).toHaveProperty("__typename", "FullUser");
      expect(meData).toHaveProperty("uuid", meTestUser.uuid);
      expect(meData).toHaveProperty("username", meTestUser.username);
      expect(meData).toHaveProperty("pwFunc", meTestUser.pwFunc);
      expect(meData).toHaveProperty("pwDigest", meTestUser.pwDigest);
      expect(meData).toHaveProperty("pwCost", meTestUser.pwCost);
      expect(meData).toHaveProperty("pwKeySize", meTestUser.pwKeySize);
      expect(meData).toHaveProperty("pwSalt", meTestUser.pwSalt);
      expect(meData).toHaveProperty(
        "createdAt",
        meTestUser.createdAt.getTime()
      );
      expect(meData).toHaveProperty(
        "updatedAt",
        meTestUser.updatedAt.getTime()
      );
      expect(meData).toHaveProperty("pubSignKey", meTestUser.pubSignKey);
      expect(meData).toHaveProperty(
        "encPrivSignKey",
        meTestUser.encPrivSignKey
      );
      expect(meData).toHaveProperty("encSecretKey", meTestUser.encSecretKey);
      expect(meData).toHaveProperty("pubEncKey", meTestUser.pubEncKey);
      expect(meData).toHaveProperty("encPrivEncKey", meTestUser.encPrivEncKey);
      expect(meData).toHaveProperty("emails");
      const meEmails = meData.emails;
      expect(meEmails).toHaveLength(1);
      const meEmail = meEmails[0];
      expect(meEmail).toHaveProperty("__typename", "UserEmail");
      expect(meEmail).toHaveProperty("email", meTestEmail.email);
      expect(meEmail).toHaveProperty("user");
      expect(meEmail.user).toHaveProperty("__typename", "FullUser");
      expect(meEmail.user).toHaveProperty("uuid", meData.uuid);
      expect(meEmail).toHaveProperty("primary", true);
      expect(meEmail).toHaveProperty("verified", true);
      expect(meEmail).toHaveProperty("createdAt");
      expect(meEmail).toHaveProperty("updatedAt");
    });
  });

  describe("addEmail", () => {
    let addEmailUser: User = null;
    let addEmailUEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    let sendEmailVerificationSpy: jest.SpyInstance;
    const mutation = gql`
      mutation AddEmail($email: String!) {
        addEmail(email: $email) {
          uuid
          emails {
            email
            user {
              uuid
            }
            primary
            verified
          }
        }
      }
    `;

    beforeEach(() => {
      sendEmailVerificationSpy.mockReset();
    });

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("addEmail");
        addEmailUser = await transactionEntityManager.save(u);
        e.user = addEmailUser;
        addEmailUEmail = await transactionEntityManager.save(e);
      });
      const jwt = Auth.signUserJWT(addEmailUser);
      const { s, g } = generateGraphQLClients(userTestPort, jwt);
      gqlClient = g;
      subscriptionClient = s;
      sendEmailVerificationSpy = jest.spyOn(Mailer, "sendEmailVerification");
    });

    afterAll(async () => {
      sendEmailVerificationSpy.mockClear();
      await getConnection()
        .getRepository(User)
        .delete(addEmailUser);
      subscriptionClient.close();
    });

    it("should add a new email to the user", async () => {
      expect.assertions(21);
      const email = "newlyAddedEmail@udia.ca";
      const addEmailMutationResponse = await gqlClient.mutate({
        mutation,
        variables: { email }
      });
      expect(addEmailMutationResponse).toHaveProperty("data");
      const addEmailResponseData = addEmailMutationResponse.data;
      expect(addEmailResponseData).toHaveProperty("addEmail");
      const addEmail = addEmailResponseData.addEmail;

      expect(addEmail).toHaveProperty("__typename", "FullUser");
      expect(addEmail).toHaveProperty("uuid", addEmailUser.uuid);
      expect(addEmail).toHaveProperty("emails");
      const emails = addEmail.emails;
      expect(emails).toHaveLength(2);
      const originalEmail = emails.filter(e => e.primary)[0];
      expect(originalEmail).toHaveProperty("__typename", "UserEmail");
      expect(originalEmail).toHaveProperty("email", addEmailUEmail.email);
      expect(originalEmail).toHaveProperty("user");
      expect(originalEmail.user).toHaveProperty("__typename", "FullUser");
      expect(originalEmail.user).toHaveProperty("uuid", addEmail.uuid);
      expect(originalEmail).toHaveProperty("primary", true);
      expect(originalEmail).toHaveProperty("verified", true);
      const newEmail = emails.filter(e => !e.primary)[0];
      expect(newEmail).toHaveProperty("__typename", "UserEmail");
      expect(newEmail).toHaveProperty("email", email);
      expect(newEmail).toHaveProperty("user");
      expect(newEmail.user).toHaveProperty("__typename", "FullUser");
      expect(newEmail.user).toHaveProperty("uuid", addEmail.uuid);
      expect(newEmail).toHaveProperty("primary", false);
      expect(newEmail).toHaveProperty("verified", false);

      expect(sendEmailVerificationSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("emailVerification", () => {
    let sendEmailVerUser: User = null;
    let sendEmailVerEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const sendEmailVerificationMutation = gql`
      mutation SendEmailVerification($email: String!) {
        sendEmailVerification(email: $email)
      }
    `;
    const verifyEmailTokenMutation = gql`
      mutation VerifyEmailToken($emailToken: String!) {
        verifyEmailToken(emailToken: $emailToken)
      }
    `;

    let sendEmailVerificationSpy: jest.SpyInstance;

    beforeEach(() => {
      sendEmailVerificationSpy.mockReset();
    });

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("verifyEmail");
        sendEmailVerUser = await transactionEntityManager.save(u);
        e.user = sendEmailVerUser;
        e.verified = false;
        sendEmailVerEmail = await transactionEntityManager.save(e);
      });
      const jwt = Auth.signUserJWT(sendEmailVerUser);
      const { s, g } = generateGraphQLClients(userTestPort, jwt);
      gqlClient = g;
      subscriptionClient = s;
      sendEmailVerificationSpy = jest.spyOn(Mailer, "sendEmailVerification");
    });

    afterAll(async () => {
      sendEmailVerificationSpy.mockClear();
      await getConnection()
        .getRepository(User)
        .delete(sendEmailVerUser);
      subscriptionClient.close();
    });

    it("should send and verify an email verification.", async () => {
      expect.assertions(8);
      const sendEmailVerificationResp = await gqlClient.mutate({
        mutation: sendEmailVerificationMutation,
        variables: { email: sendEmailVerEmail.email }
      });
      expect(sendEmailVerificationResp).toHaveProperty("data");
      const sendEmailVerificationData = sendEmailVerificationResp.data;
      expect(sendEmailVerificationData).toHaveProperty(
        "sendEmailVerification",
        true
      );
      expect(sendEmailVerificationSpy).toHaveBeenCalledTimes(1);
      const sendEmailParams = sendEmailVerificationSpy.mock.calls[0];
      expect(sendEmailParams[0]).toEqual(sendEmailVerUser.username);
      expect(sendEmailParams[1]).toEqual(sendEmailVerEmail.email);
      expect(sendEmailParams[2]).toMatch(
        new RegExp(`^${sendEmailVerEmail.lEmail}:.*`)
      );
      const emailToken = sendEmailParams[2];
      const verifyEmailTokenReponse = await gqlClient.mutate({
        mutation: verifyEmailTokenMutation,
        variables: { emailToken }
      });
      expect(verifyEmailTokenReponse).toHaveProperty("data");
      const verifyEmailTokenData = verifyEmailTokenReponse.data;
      expect(verifyEmailTokenData).toHaveProperty("verifyEmailToken", true);
    });
  });

  describe("setPrimaryEmail", () => {
    let emailPrimaryUser: User = null;
    let emailPrimaryEmail: UserEmail = null;
    let emailSecEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const mutation = gql`
      mutation SetPrimaryEmail($email: String!) {
        setPrimaryEmail(email: $email) {
          uuid
          emails {
            email
            user {
              uuid
            }
            primary
            verified
          }
        }
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("primaryEmail");
        emailPrimaryUser = await transactionEntityManager.save(u);
        e.user = emailPrimaryUser;
        emailPrimaryEmail = await transactionEntityManager.save(e);
        emailSecEmail = new UserEmail();
        emailSecEmail.user = emailPrimaryUser;
        emailSecEmail.email = "secEmail@udia.ca";
        emailSecEmail.lEmail = "secemail@udia.ca";
        emailSecEmail.verified = true;
        emailSecEmail = await transactionEntityManager.save(emailSecEmail);
      });
      const jwt = Auth.signUserJWT(emailPrimaryUser);
      const { s, g } = generateGraphQLClients(userTestPort, jwt);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(emailPrimaryUser);
      subscriptionClient.close();
    });

    it("should set a user email as primary", async () => {
      expect.assertions(20);
      const setPrimaryEmailResp = await gqlClient.mutate({
        mutation,
        variables: { email: emailSecEmail.email }
      });
      expect(setPrimaryEmailResp).toHaveProperty("data");
      const setPrimaryEmailData = setPrimaryEmailResp.data;
      expect(setPrimaryEmailData).toHaveProperty("setPrimaryEmail");
      const setPrimaryEmail = setPrimaryEmailData.setPrimaryEmail;

      expect(setPrimaryEmail).toHaveProperty("__typename", "FullUser");
      expect(setPrimaryEmail).toHaveProperty("uuid", emailPrimaryUser.uuid);
      expect(setPrimaryEmail).toHaveProperty("emails");
      const emails = setPrimaryEmail.emails;
      expect(emails).toHaveLength(2);
      const primaryEmail = emails.filter(e => e.primary)[0];
      expect(primaryEmail).toHaveProperty("__typename", "UserEmail");
      expect(primaryEmail).toHaveProperty("email", emailSecEmail.email);
      expect(primaryEmail).toHaveProperty("user");
      expect(primaryEmail.user).toHaveProperty("__typename", "FullUser");
      expect(primaryEmail.user).toHaveProperty("uuid", emailPrimaryUser.uuid);
      expect(primaryEmail).toHaveProperty("primary", true);
      expect(primaryEmail).toHaveProperty("verified", true);
      const secondaryEmail = emails.filter(e => !e.primary)[0];
      expect(secondaryEmail).toHaveProperty("__typename", "UserEmail");
      expect(secondaryEmail).toHaveProperty("email", emailPrimaryEmail.email);
      expect(secondaryEmail).toHaveProperty("user");
      expect(secondaryEmail.user).toHaveProperty("__typename", "FullUser");
      expect(secondaryEmail.user).toHaveProperty("uuid", emailPrimaryUser.uuid);
      expect(secondaryEmail).toHaveProperty("primary", false);
      expect(secondaryEmail).toHaveProperty("verified", true);
    });
  });

  describe("removeEmail", () => {
    let removeEmailUser: User = null;
    let remPrimaryEmail: UserEmail = null;
    let keepSecEmail: UserEmail = null;
    let gqlClient: ApolloClient<NormalizedCacheObject> = null;
    let subscriptionClient: SubscriptionClient = null;
    const mutation = gql`
      mutation RemoveEmail($email: String!) {
        removeEmail(email: $email) {
          uuid
          emails {
            email
            user {
              uuid
            }
            primary
            verified
          }
        }
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("removeEmail");
        removeEmailUser = await transactionEntityManager.save(u);
        e.user = removeEmailUser;
        remPrimaryEmail = await transactionEntityManager.save(e);
        keepSecEmail = new UserEmail();
        keepSecEmail.user = removeEmailUser;
        keepSecEmail.email = "secRemoveEmail@udia.ca";
        keepSecEmail.lEmail = "secremoveemail@udia.ca";
        keepSecEmail.verified = true;
        keepSecEmail = await transactionEntityManager.save(keepSecEmail);
      });
      const jwt = Auth.signUserJWT(removeEmailUser);
      const { s, g } = generateGraphQLClients(userTestPort, jwt);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(removeEmailUser);
      subscriptionClient.close();
    });

    it("should remove a user's email", async () => {
      expect.assertions(12);
      const removeEmailResp = await gqlClient.mutate({
        mutation,
        variables: { email: remPrimaryEmail.email }
      });
      expect(removeEmailResp).toHaveProperty("data");
      const removeEmailData = removeEmailResp.data;
      expect(removeEmailData).toHaveProperty("removeEmail");
      const removeEmail = removeEmailData.removeEmail;

      expect(removeEmail).toHaveProperty("__typename", "FullUser");
      expect(removeEmail).toHaveProperty("uuid", removeEmailUser.uuid);
      expect(removeEmail).toHaveProperty("emails");
      const userEmails = removeEmail.emails;
      expect(userEmails).toHaveLength(1);
      const userEmail = userEmails[0];
      expect(userEmail).toHaveProperty("__typename", "UserEmail");
      expect(userEmail).toHaveProperty("user");
      expect(userEmail.user).toHaveProperty("uuid", removeEmail.uuid);
      expect(userEmail).toHaveProperty("email", keepSecEmail.email);
      expect(userEmail).toHaveProperty("primary", true);
      expect(userEmail).toHaveProperty("verified", true);
    });
  });

  // it("should update a user's password (naive/email) then delete a user.", async done => {
  //   // this should really be broken up into 5 tests, but gqlClient is hard
  //   const updateUserAuthParams = {
  //     uip: "Another secure p455word~",
  //     pwCost: 3000,
  //     pwSalt: "066c1fb06d3488df129bf476dfa6e58e6223293d",
  //     pwFunc: "pbkdf2",
  //     pwDigest: "sha512",
  //     pwKeySize: 768
  //   };

  //   // PART A - UPDATE PASSWORD (logged in)

  //   // get old password
  //   const { pw } = deriveSubKeysFromUserInputPassword(updateUserAuthParams);
  //   // generate a new password
  //   updateUserAuthParams.pwCost = 3001;
  //   updateUserAuthParams.pwSalt = "09b5f819982f9f2ef18ec3b4156dbbc802c79d11";
  //   updateUserAuthParams.uip = `My new รєςยгє p4$!w#rd.`;
  //   const { pw: newerPw } = deriveSubKeysFromUserInputPassword(
  //     updateUserAuthParams
  //   );

  //   const updatePasswordMutationResponse = await gqlClient.mutate({
  //     mutation: gql`
  //       mutation UpdatePassword(
  //         $newPw: String!
  //         $pw: String!
  //         $pwFunc: String!
  //         $pwDigest: String!
  //         $pwCost: Int!
  //         $pwKeySize: Int!
  //         $pwSalt: String!
  //       ) {
  //         updatePassword(
  //           newPw: $newPw
  //           pw: $pw
  //           pwFunc: $pwFunc
  //           pwDigest: $pwDigest
  //           pwCost: $pwCost
  //           pwKeySize: $pwKeySize
  //           pwSalt: $pwSalt
  //         ) {
  //           uuid
  //           username
  //           pwSalt
  //           pwCost
  //           createdAt
  //           updatedAt
  //         }
  //       }
  //     `,
  //     variables: {
  //       newPw: newerPw,
  //       pw,
  //       pwFunc: updateUserAuthParams.pwFunc,
  //       pwDigest: updateUserAuthParams.pwDigest,
  //       pwCost: updateUserAuthParams.pwCost,
  //       pwKeySize: updateUserAuthParams.pwKeySize,
  //       pwSalt: updateUserAuthParams.pwSalt
  //     }
  //   });
  //   expect(updatePasswordMutationResponse).toHaveProperty("data");
  //   const updatePasswordMutationData = updatePasswordMutationResponse.data;
  //   expect(updatePasswordMutationData).toHaveProperty("updatePassword");
  //   const updatePassword = updatePasswordMutationData.updatePassword;
  //   expect(updatePassword).toHaveProperty("__typename", "FullUser");
  //   expect(updatePassword).toHaveProperty("uuid");
  //   expect(updatePassword).toHaveProperty("username", "updateMe");
  //   expect(updatePassword).toHaveProperty(
  //     "pwSalt",
  //     updateUserAuthParams.pwSalt
  //   );
  //   expect(updatePassword).toHaveProperty(
  //     "pwCost",
  //     updateUserAuthParams.pwCost
  //   );
  //   expect(updatePassword).toHaveProperty("createdAt");
  //   expect(updatePassword).toHaveProperty("updatedAt");
  //   const { createdAt, updatedAt } = updatePassword;
  //   expect(updatedAt).toBeGreaterThanOrEqual(createdAt);

  //   // PART B - REQUEST PASSWORD RESET EMAIL

  //   // reset the password using email/forgot password function
  //   const sendForgotPasswordResponse = await gqlClient.mutate({
  //     mutation: gql`
  //       mutation SendForgotPasswordEmail($email: String!) {
  //         sendForgotPasswordEmail(email: $email)
  //       }
  //     `,
  //     variables: { email: "upDateme@udia.ca" }
  //   });
  //   expect(sendForgotPasswordResponse).toEqual({
  //     data: { sendForgotPasswordEmail: true }
  //   });
  //   expect(sendForgotPassEmailSpy).toHaveBeenCalledTimes(1);
  //   const sendEmailParams = sendForgotPassEmailSpy.mock.calls[0];
  //   expect(sendEmailParams[0]).toEqual("updateMe");
  //   expect(sendEmailParams[1]).toEqual("updateMe@udia.ca");
  //   expect(sendEmailParams[2]).toMatch(/^updateme:.*/);
  //   const resetToken = sendEmailParams[2];

  //   // PART C - VERIFY RESET TOKEN
  //   const checkResetTokenResponse = await gqlClient.query({
  //     query: gql`
  //       query CheckResetToken($resetToken: String!) {
  //         checkResetToken(resetToken: $resetToken) {
  //           isValid
  //           expiry
  //         }
  //       }
  //     `,
  //     variables: { resetToken }
  //   });
  //   expect(checkResetTokenResponse).toHaveProperty("data");
  //   const checkResetTokenData: any = checkResetTokenResponse.data;
  //   expect(checkResetTokenData).toHaveProperty("checkResetToken");
  //   const checkResetToken = checkResetTokenData.checkResetToken;
  //   expect(checkResetToken).toHaveProperty("__typename", "TokenValidity");
  //   expect(checkResetToken).toHaveProperty("isValid", true);
  //   expect(checkResetToken).toHaveProperty("expiry");
  //   expect(checkResetToken.expiry).toBeGreaterThan(Date.now());

  //   // PART D - UPDATE PASSWORD (reset token)
  //   // generate a newest password
  //   updateUserAuthParams.pwCost = 4000;
  //   updateUserAuthParams.pwSalt = "9ab5f819982f9f2ef10ec3b4156dbbc802c79c14";
  //   updateUserAuthParams.uip = `Transcend newest รєςยгє p4$!w#rd.`;
  //   const { pw: newestPw } = deriveSubKeysFromUserInputPassword(
  //     updateUserAuthParams
  //   );

  //   const resetPasswordResponse = await gqlClient.mutate({
  //     mutation: gql`
  //       mutation ResetPassword(
  //         $resetToken: String!
  //         $newPw: String!
  //         $pwFunc: String!
  //         $pwDigest: String!
  //         $pwCost: Int!
  //         $pwKeySize: Int!
  //         $pwSalt: String!
  //       ) {
  //         resetPassword(
  //           resetToken: $resetToken
  //           newPw: $newPw
  //           pwFunc: $pwFunc
  //           pwDigest: $pwDigest
  //           pwCost: $pwCost
  //           pwKeySize: $pwKeySize
  //           pwSalt: $pwSalt
  //         ) {
  //           jwt
  //           user {
  //             uuid
  //             username
  //             pwSalt
  //             pwCost
  //             createdAt
  //             updatedAt
  //           }
  //         }
  //       }
  //     `,
  //     variables: {
  //       resetToken,
  //       newPw: newestPw,
  //       pwFunc: updateUserAuthParams.pwFunc,
  //       pwDigest: updateUserAuthParams.pwDigest,
  //       pwCost: updateUserAuthParams.pwCost,
  //       pwKeySize: updateUserAuthParams.pwKeySize,
  //       pwSalt: updateUserAuthParams.pwSalt
  //     }
  //   });

  //   expect(resetPasswordResponse).toHaveProperty("data");
  //   const resetPasswordData = resetPasswordResponse.data;
  //   expect(resetPasswordData).toHaveProperty("resetPassword");
  //   const resetPassword = resetPasswordData.resetPassword;
  //   expect(resetPassword).toHaveProperty("__typename", "UserAuthPayload");
  //   expect(resetPassword).toHaveProperty("jwt");
  //   expect(resetPassword).toHaveProperty("user");
  //   const resetPasswordUser = resetPassword.user;
  //   expect(resetPasswordUser).toHaveProperty("uuid", updatePassword.uuid);
  //   expect(resetPasswordUser).toHaveProperty("username", "updateMe");
  //   expect(resetPasswordUser).toHaveProperty(
  //     "pwSalt",
  //     updateUserAuthParams.pwSalt
  //   );
  //   expect(resetPasswordUser).toHaveProperty(
  //     "pwCost",
  //     updateUserAuthParams.pwCost
  //   );
  //   expect(resetPasswordUser).toHaveProperty("createdAt");
  //   expect(resetPasswordUser).toHaveProperty("updatedAt");
  //   expect(resetPasswordUser.updatedAt).toBeGreaterThan(
  //     resetPasswordUser.createdAt
  //   );

  //   // PART E - DELETE USER
  //   // because JWT is stateless, the old one still works. don't update client
  //   const deleteUserMutationResponse = await gqlClient.mutate({
  //     mutation: gql`
  //       mutation DeleteUser($pw: String!) {
  //         deleteUser(pw: $pw)
  //       }
  //     `,
  //     variables: { pw: newestPw }
  //   });
  //   expect(deleteUserMutationResponse).toEqual({
  //     data: { deleteUser: true }
  //   });

  //   // PART F - VERIFY UNDEFINED/NULL ME
  //   const meQueryResponse = await gqlClient.query({
  //     query: gql`
  //       query Me {
  //         me {
  //           uuid
  //           username
  //         }
  //       }
  //     `,
  //     fetchPolicy: "no-cache" // required or old user is returned
  //   });
  //   expect(meQueryResponse).toHaveProperty("data");
  //   const meQueryResponseData: any = meQueryResponse.data;
  //   expect(meQueryResponseData).toEqual({ me: null });
  //   done();
  // });

  // it("should handle graphQL validation errors.", async done => {
  //   const email = "badactor@udia.ca";
  //   try {
  //     await gqlClient.query({
  //       query: gql`
  //         query GetUserAuthParams($email: String!) {
  //           getUserAuthParams(email: $email) {
  //             pwFunc
  //             pwDigest
  //             pwCost
  //             pwKeySize
  //             pwSalt
  //           }
  //         }
  //       `,
  //       variables: { email }
  //     });
  //   } catch (err) {
  //     expect(err).toHaveProperty("networkError", null);
  //     expect(err).toHaveProperty("graphQLErrors", [
  //       {
  //         locations: [{ column: 3, line: 2 }],
  //         message: "The request is invalid.\n* email: Email not found.",
  //         path: ["getUserAuthParams"],
  //         state: { email: ["Email not found."] }
  //       }
  //     ]);
  //     expect(err).toHaveProperty(
  //       "message",
  //       "GraphQL error: The request is invalid.\n* email: Email not found."
  //     );
  //     expect(err).toHaveProperty("extraInfo", undefined);
  //     done();
  //     return;
  //   }
  //   done("Error not caught.");
  // });
});
