import { NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import { Server } from "http";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { getConnection } from "typeorm";
import { PORT } from "../../constants";
import { Item } from "../../entity/Item";
import { User } from "../../entity/User";
import { UserEmail } from "../../entity/UserEmail";
import start from "../../index";
import Mailer from "../../mailer";
import Auth from "../../modules/Auth";
import ItemManager from "../../modules/ItemManager";
import {
  generateGenericUser,
  generateGraphQLClients,
  generateUserCryptoParams
} from "../testHelper";

// GraphQL FullUser Emails
// interface IUserEmail {
//   email: string;
//   primary: boolean;
//   verified: boolean;
//   createdAt: number;
//   updatedAt: number;
//   verificationExpiry: number;
// }

// GraphQL FullUser
interface IFullUser {
  uuid: string;
  username: string;
  emails: UserEmail[];
  encSecretKey: string;
  pubVerifyKey: string;
  encPrivateSignKey: string;
  pubEncryptKey: string;
  encPrivateDecryptKey: string;
  pwFunc: string;
  pwDigest: string;
  pwCost: number;
  pwKeySize: number;
  pwNonce: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Integration tests for all user related GraphQL API calls
 */
describe("Users", () => {
  // Ports are staggered to prevent multiple tests from clobbering
  const userTestPort = `${parseInt(PORT, 10) + 3}`;
  let server: Server;

  // Sanity function to ensure test state is clean.
  async function deleteUsers() {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(User)
      .where({ lUsername: "unknown" })
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
      .orWhere("lUsername = :updatePass", { updatePass: "updatepass" })
      .orWhere("lUsername = :resetPass", { resetPass: "resetpass" })
      .orWhere("lUsername = :deleteUser", { deleteUser: "deleteusertest" })
      .orWhere("lUsername = :refreshJWT", { refreshJWT: "refreshjwt" })
      .orWhere("lUsername = :resolveUser", { resolveUser: "resolveuser" })
      .orWhere("lUsername LIKE :pTestUsers", { pTestUsers: "testgetusers%" })
      .execute();
  }

  // Start the webserver
  beforeAll(async () => {
    server = await start(userTestPort);
    await deleteUsers();
  });

  // Stop the webserver
  afterAll(async done => {
    await deleteUsers();
    server.close(done);
  });

  describe("GraphQL API", () => {
    describe("checkEmailExists", () => {
      let emailExistsUser: User;
      let emailExistsEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
        const checkUnknownEmailExistsQuery = await gqlClient.query<{
          checkEmailExists: number;
        }>({
          query,
          variables: {
            email: unknownEmail
          }
        });
        expect(checkUnknownEmailExistsQuery).toHaveProperty("data");
        const checkUnknownEmailExistsQueryData =
          checkUnknownEmailExistsQuery.data;
        expect(checkUnknownEmailExistsQueryData).toHaveProperty(
          "checkEmailExists"
        );
        const checkUnknownEmailExists =
          checkUnknownEmailExistsQueryData.checkEmailExists;
        expect(checkUnknownEmailExists).toEqual(0);
      });

      it("should throw graphql error when email is taken", async () => {
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
      let usernameExistsUser: User;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
          await transactionEntityManager.save(e);
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
        const checkUnknownUsernameExistsQuery = await gqlClient.query<{
          checkUsernameExists: number;
        }>({
          query,
          variables: {
            username: unknownUsername
          }
        });
        expect(checkUnknownUsernameExistsQuery).toHaveProperty("data");
        const checkUnknownUsernameExistsQueryData =
          checkUnknownUsernameExistsQuery.data;
        expect(checkUnknownUsernameExistsQueryData).toHaveProperty(
          "checkUsernameExists"
        );
        const checkUnknownUsernameExists =
          checkUnknownUsernameExistsQueryData.checkUsernameExists;
        expect(checkUnknownUsernameExists).toEqual(0);
      });

      it("should throw graphql error when username is taken", async () => {
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

    describe("getUserAuthParams", () => {
      let authParamsUser: User;
      let authParamsEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      const query = gql`
        query GetUserAuthParams($email: String!) {
          getUserAuthParams(email: $email) {
            pwFunc
            pwDigest
            pwCost
            pwKeySize
            pwNonce
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
        const getAuthParamsQueryResponse = await gqlClient.query<{
          getUserAuthParams: {
            pwFunc: string;
            pwDigest: string;
            pwCost: number;
            pwKeySize: number;
            pwNonce: string;
          };
        }>({
          query,
          variables: { email: authParamsEmail.email }
        });
        const { pwFunc, pwDigest, pwCost, pwKeySize, pwNonce } = authParamsUser;

        expect(getAuthParamsQueryResponse).toHaveProperty("data");
        const getAuthParamsData = getAuthParamsQueryResponse.data;
        expect(getAuthParamsData).toHaveProperty("getUserAuthParams");
        const getUserAuthParams = getAuthParamsData.getUserAuthParams;
        expect(getUserAuthParams).toHaveProperty("pwFunc", pwFunc);
        expect(getUserAuthParams).toHaveProperty("pwDigest", pwDigest);
        expect(getUserAuthParams).toHaveProperty("pwCost", pwCost);
        expect(getUserAuthParams).toHaveProperty("pwKeySize", pwKeySize);
        expect(getUserAuthParams).toHaveProperty("pwNonce", pwNonce);
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

    describe("me", () => {
      let meTestUser: User;
      let meTestEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
            pwNonce
            pubVerifyKey
            encPrivateSignKey
            encSecretKey
            pubEncryptKey
            encPrivateDecryptKey
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
        const meQueryResponse = await gqlClient.query<{ me: IFullUser }>({
          query
        });
        expect(meQueryResponse).toHaveProperty("data");
        const meQueryResponseData = meQueryResponse.data;
        expect(meQueryResponseData).toHaveProperty("me");
        const meData = meQueryResponseData.me;
        expect(meData).toHaveProperty("__typename", "FullUser");
        expect(meData).toHaveProperty("uuid", meTestUser.uuid);
        expect(meData).toHaveProperty("username", meTestUser.username);
        expect(meData).toHaveProperty("pwFunc", meTestUser.pwFunc);
        expect(meData).toHaveProperty("pwDigest", meTestUser.pwDigest);
        expect(meData).toHaveProperty("pwCost", meTestUser.pwCost);
        expect(meData).toHaveProperty("pwKeySize", meTestUser.pwKeySize);
        expect(meData).toHaveProperty("pwNonce", meTestUser.pwNonce);
        expect(meData).toHaveProperty(
          "createdAt",
          meTestUser.createdAt.getTime()
        );
        expect(meData).toHaveProperty(
          "updatedAt",
          meTestUser.updatedAt.getTime()
        );
        expect(meData).toHaveProperty("pubVerifyKey", meTestUser.pubVerifyKey);
        expect(meData).toHaveProperty(
          "encPrivateSignKey",
          meTestUser.encPrivateSignKey
        );
        expect(meData).toHaveProperty("encSecretKey", meTestUser.encSecretKey);
        expect(meData).toHaveProperty(
          "pubEncryptKey",
          meTestUser.pubEncryptKey
        );
        expect(meData).toHaveProperty(
          "encPrivateDecryptKey",
          meTestUser.encPrivateDecryptKey
        );
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

    describe("createUser", () => {
      let createTestUserID: string;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      let sendEmailVerificationSpy: jest.SpyInstance;
      const mutation = gql`
        mutation CreateNewUser(
          $username: String!
          $email: String!
          $pw: String!
          $pwCost: Int!
          $pwNonce: String!
          $pwFunc: String!
          $pwDigest: String!
          $pwKeySize: Int!
          $pubVerifyKey: String!
          $encPrivateSignKey: String!
          $encSecretKey: String!
          $pubEncryptKey: String!
          $encPrivateDecryptKey: String!
        ) {
          createUser(
            username: $username
            email: $email
            pw: $pw
            pwCost: $pwCost
            pwNonce: $pwNonce
            pwFunc: $pwFunc
            pwDigest: $pwDigest
            pwKeySize: $pwKeySize
            pubVerifyKey: $pubVerifyKey
            encPrivateSignKey: $encPrivateSignKey
            encSecretKey: $encSecretKey
            pubEncryptKey: $pubEncryptKey
            encPrivateDecryptKey: $encPrivateDecryptKey
          ) {
            jwt
            user {
              uuid
              username
              pwFunc
              pwDigest
              pwCost
              pwKeySize
              pwNonce
              createdAt
              updatedAt
              pubVerifyKey
              encPrivateSignKey
              encSecretKey
              pubEncryptKey
              encPrivateDecryptKey
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
        sendEmailVerificationSpy.mockRestore();
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
          pwNonce,
          pwCost,
          pwFunc,
          pwDigest,
          pwKeySize,
          pubVerifyKey,
          encPrivateSignKey,
          encSecretKey,
          pubEncryptKey,
          encPrivateDecryptKey
        } = params;
        // Even though this is a test, don't send the mk and ak values
        delete params.mk;
        delete params.ak;

        const createUserMutationResp = await gqlClient.mutate<{
          createUser: { jwt: string; user: IFullUser };
        }>({
          mutation,
          variables: { username, email, ...params }
        });
        expect(createUserMutationResp).toHaveProperty("data");
        const createUserMutationData = createUserMutationResp.data!;
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
        expect(createdUser).toHaveProperty("pwNonce", pwNonce);
        expect(createdUser).toHaveProperty("createdAt");
        expect(createdUser).toHaveProperty("updatedAt");
        expect(createdUser).toHaveProperty("pubVerifyKey", pubVerifyKey);
        expect(createdUser).toHaveProperty(
          "encPrivateSignKey",
          encPrivateSignKey
        );
        expect(createdUser).toHaveProperty("encSecretKey", encSecretKey);
        expect(createdUser).toHaveProperty("pubEncryptKey", pubEncryptKey);
        expect(createdUser).toHaveProperty(
          "encPrivateDecryptKey",
          encPrivateDecryptKey
        );
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

    describe("signInUser", () => {
      const testUserEmail = "signInTest@udia.ca";
      const testUserInputtedPassword = "signInTestPassword Test!^123";
      const { pw } = generateUserCryptoParams(
        testUserEmail,
        testUserInputtedPassword
      );
      let signInTestUser: User;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
          signInTestUser = await transactionEntityManager.save(u);
          e.user = signInTestUser;
          await transactionEntityManager.save(e);
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
        const signInUserMutationResponse = await gqlClient.mutate<{
          signInUser: {
            jwt: string;
            user: IFullUser;
          };
        }>({
          mutation,
          variables: { email: testUserEmail, pw }
        });

        expect(signInUserMutationResponse).toHaveProperty("data");
        const signInUserMutationData = signInUserMutationResponse.data!;
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

    describe("addEmail", () => {
      let addEmailUser: User;
      let addEmailUEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
        const addEmailMutationResponse = await gqlClient.mutate<{
          addEmail: IFullUser;
        }>({
          mutation,
          variables: { email }
        });
        expect(addEmailMutationResponse).toHaveProperty("data");
        const addEmailResponseData = addEmailMutationResponse.data!;
        expect(addEmailResponseData).toHaveProperty("addEmail");
        const addEmail = addEmailResponseData.addEmail;

        expect(addEmail).toHaveProperty("__typename", "FullUser");
        expect(addEmail).toHaveProperty("uuid", addEmailUser.uuid);
        expect(addEmail).toHaveProperty("emails");
        const emails = addEmail.emails;
        expect(emails).toHaveLength(2);
        const originalEmail = emails.filter((e: UserEmail) => e.primary)[0];
        expect(originalEmail).toHaveProperty("__typename", "UserEmail");
        expect(originalEmail).toHaveProperty("email", addEmailUEmail.email);
        expect(originalEmail).toHaveProperty("user");
        expect(originalEmail.user).toHaveProperty("__typename", "FullUser");
        expect(originalEmail.user).toHaveProperty("uuid", addEmail.uuid);
        expect(originalEmail).toHaveProperty("primary", true);
        expect(originalEmail).toHaveProperty("verified", true);
        const newEmail = emails.filter((e: UserEmail) => !e.primary)[0];
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

    describe("setPrimaryEmail", () => {
      let emailPrimaryUser: User;
      let emailPrimaryEmail: UserEmail;
      let emailSecEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
        const setPrimaryEmailResp = await gqlClient.mutate<{
          setPrimaryEmail: IFullUser;
        }>({
          mutation,
          variables: { email: emailSecEmail.email }
        });
        expect(setPrimaryEmailResp).toHaveProperty("data");
        const setPrimaryEmailData = setPrimaryEmailResp.data!;
        expect(setPrimaryEmailData).toHaveProperty("setPrimaryEmail");
        const setPrimaryEmail = setPrimaryEmailData.setPrimaryEmail;

        expect(setPrimaryEmail).toHaveProperty("__typename", "FullUser");
        expect(setPrimaryEmail).toHaveProperty("uuid", emailPrimaryUser.uuid);
        expect(setPrimaryEmail).toHaveProperty("emails");
        const emails = setPrimaryEmail.emails;
        expect(emails).toHaveLength(2);
        const primaryEmail = emails.filter((e: UserEmail) => e.primary)[0];
        expect(primaryEmail).toHaveProperty("__typename", "UserEmail");
        expect(primaryEmail).toHaveProperty("email", emailSecEmail.email);
        expect(primaryEmail).toHaveProperty("user");
        expect(primaryEmail.user).toHaveProperty("__typename", "FullUser");
        expect(primaryEmail.user).toHaveProperty("uuid", emailPrimaryUser.uuid);
        expect(primaryEmail).toHaveProperty("primary", true);
        expect(primaryEmail).toHaveProperty("verified", true);
        const secondaryEmail = emails.filter((e: UserEmail) => !e.primary)[0];
        expect(secondaryEmail).toHaveProperty("__typename", "UserEmail");
        expect(secondaryEmail).toHaveProperty("email", emailPrimaryEmail.email);
        expect(secondaryEmail).toHaveProperty("user");
        expect(secondaryEmail.user).toHaveProperty("__typename", "FullUser");
        expect(secondaryEmail.user).toHaveProperty(
          "uuid",
          emailPrimaryUser.uuid
        );
        expect(secondaryEmail).toHaveProperty("primary", false);
        expect(secondaryEmail).toHaveProperty("verified", true);
      });
    });

    describe("removeEmail", () => {
      let removeEmailUser: User;
      let remPrimaryEmail: UserEmail;
      let keepSecEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
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
        const removeEmailData = removeEmailResp.data!;
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

    describe("updatePassword", () => {
      const username = "updatePass";
      const email = "updatePass@udia.ca";
      const oldUIP = "Old Super S3C$^T P~!۩s";
      const newUIP = "New Super S3C$^T P~!۩s";

      let updatePassUser: User;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      const { pw } = generateUserCryptoParams(email, oldUIP);

      const mutation = gql`
        mutation UpdatePassword(
          $newPw: String!
          $pw: String!
          $pwFunc: String!
          $pwDigest: String!
          $pwCost: Int!
          $pwKeySize: Int!
          $pwNonce: String!
          $encPrivateSignKey: String!
          $encSecretKey: String!
          $encPrivateDecryptKey: String!
        ) {
          updatePassword(
            newPw: $newPw
            pw: $pw
            pwFunc: $pwFunc
            pwDigest: $pwDigest
            pwCost: $pwCost
            pwKeySize: $pwKeySize
            pwNonce: $pwNonce
            encPrivateSignKey: $encPrivateSignKey
            encSecretKey: $encSecretKey
            encPrivateDecryptKey: $encPrivateDecryptKey
          ) {
            uuid
            username
            pwNonce
            pwCost
            pwFunc
            pwDigest
            pwCost
            pwKeySize
            pwNonce
            encPrivateDecryptKey
            encSecretKey
            encPrivateSignKey
            createdAt
            updatedAt
          }
        }
      `;

      beforeAll(async () => {
        const pwHash = await Auth.hashPassword(pw);
        await getConnection().transaction(async transactionEntityManager => {
          const { u, e } = generateGenericUser(username);
          u.pwHash = pwHash;
          updatePassUser = await transactionEntityManager.save(u);
          e.user = updatePassUser;
          await transactionEntityManager.save(e);
        });
        const jwt = Auth.signUserJWT(updatePassUser);
        const { s, g } = generateGraphQLClients(userTestPort, jwt);
        gqlClient = g;
        subscriptionClient = s;
      });

      afterAll(async () => {
        await getConnection()
          .getRepository(User)
          .delete(updatePassUser);
        subscriptionClient.close();
      });

      it("should update a user's password.", async () => {
        expect.assertions(16);
        const {
          pw: newPw,
          pwFunc,
          pwDigest,
          pwCost,
          pwKeySize,
          pwNonce,
          encPrivateDecryptKey,
          encSecretKey,
          encPrivateSignKey
        } = generateUserCryptoParams(email, newUIP);

        const updatePasswordMutationResponse = await gqlClient.mutate<{
          updatePassword: IFullUser;
        }>({
          mutation,
          variables: {
            newPw,
            pw,
            pwFunc,
            pwDigest,
            pwCost,
            pwKeySize,
            pwNonce,
            encPrivateDecryptKey,
            encSecretKey,
            encPrivateSignKey
          }
        });

        expect(updatePasswordMutationResponse).toHaveProperty("data");
        const updatePasswordData = updatePasswordMutationResponse.data!;
        expect(updatePasswordData).toHaveProperty("updatePassword");
        const updatePassword = updatePasswordData.updatePassword;

        expect(updatePassword).toHaveProperty("__typename", "FullUser");
        expect(updatePassword).toHaveProperty("uuid", updatePassUser.uuid);
        expect(updatePassword).toHaveProperty(
          "username",
          updatePassUser.username
        );
        expect(updatePassword).toHaveProperty("pwNonce", pwNonce);
        expect(updatePassword).toHaveProperty("pwCost", pwCost);
        expect(updatePassword).toHaveProperty("pwFunc", pwFunc);
        expect(updatePassword).toHaveProperty("pwDigest", pwDigest);
        expect(updatePassword).toHaveProperty("pwKeySize", pwKeySize);
        expect(updatePassword).toHaveProperty(
          "encPrivateDecryptKey",
          encPrivateDecryptKey
        );
        expect(updatePassword).toHaveProperty("encSecretKey", encSecretKey);
        expect(updatePassword).toHaveProperty(
          "encPrivateSignKey",
          encPrivateSignKey
        );
        expect(updatePassword).toHaveProperty(
          "createdAt",
          updatePassUser.createdAt.getTime()
        );
        expect(updatePassword).toHaveProperty("updatedAt");
        expect(updatePassword.updatedAt).toBeGreaterThan(
          updatePassUser.updatedAt.getTime()
        );
      });

      it("should reject with graphql error when old pw is invalid.", async () => {
        expect.assertions(1);
        const {
          pw: newPw,
          pwFunc,
          pwDigest,
          pwCost,
          pwKeySize,
          pwNonce,
          encPrivateDecryptKey,
          encSecretKey,
          encPrivateSignKey
        } = generateUserCryptoParams(email, newUIP);

        return expect(
          gqlClient.mutate({
            mutation,
            variables: {
              newPw,
              pw: "wrongoldpassword",
              pwFunc,
              pwDigest,
              pwCost,
              pwKeySize,
              pwNonce,
              encPrivateDecryptKey,
              encSecretKey,
              encPrivateSignKey
            }
          })
        ).rejects.toHaveProperty(
          "message",
          "GraphQL error: The request is invalid.\n* pw: Invalid password."
        );
      });
    });

    describe("emailVerification", () => {
      let sendEmailVerUser: User;
      let sendEmailVerEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      let sendEmailVerificationSpy: jest.SpyInstance;
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
        const sendEmailVerificationResp = await gqlClient.mutate<{
          sendEmailVerification: boolean;
        }>({
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

      it("should handle email send rate limit", async () => {
        expect.assertions(5);
        const rateLimitEmail: UserEmail = new UserEmail();
        rateLimitEmail.email = "verifyEmailRate@udia.ca";
        rateLimitEmail.lEmail = "verifyemailrate@udia.ca";
        rateLimitEmail.user = sendEmailVerUser;
        await getConnection()
          .getRepository(UserEmail)
          .save(rateLimitEmail);
        const sendEmailVerificationResp = await gqlClient.mutate<{
          sendEmailverification: boolean;
        }>({
          mutation: sendEmailVerificationMutation,
          variables: { email: rateLimitEmail.email }
        });
        expect(sendEmailVerificationResp).toHaveProperty("data");
        const sendEmailVerificationData = sendEmailVerificationResp.data;
        expect(sendEmailVerificationData).toHaveProperty(
          "sendEmailVerification",
          true
        );
        expect(sendEmailVerificationSpy).toHaveBeenCalledTimes(1);
        sendEmailVerificationSpy.mockClear();
        try {
          await gqlClient.mutate({
            mutation: sendEmailVerificationMutation,
            variables: { email: rateLimitEmail.email }
          });
        } catch (err) {
          expect(err).toHaveProperty(
            "message",
            `GraphQL error: The request is invalid.\n` +
              `* email: Email sent within last 15 minutes. Wait 14 minutes, 59 seconds.`
          );
        } finally {
          expect(sendEmailVerificationSpy).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe("passwordResetVerification", () => {
      let resetPassUser: User;
      let resetPassEmail: UserEmail;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      let sendForgotPasswordSpy: jest.SpyInstance;
      const sendForgotPasswordEmailMutation = gql`
        mutation SendForgotPasswordEmail($email: String!) {
          sendForgotPasswordEmail(email: $email)
        }
      `;
      const checkResetTokenQuery = gql`
        query CheckResetToken($resetToken: String!) {
          checkResetToken(resetToken: $resetToken) {
            isValid
            expiry
          }
        }
      `;
      const resetPasswordMutation = gql`
        mutation ResetPassword(
          $resetToken: String!
          $newPw: String!
          $pwFunc: String!
          $pwDigest: String!
          $pwCost: Int!
          $pwKeySize: Int!
          $pwNonce: String!
          $pubVerifyKey: String!
          $encPrivateSignKey: String!
          $encSecretKey: String!
          $pubEncryptKey: String!
          $encPrivateDecryptKey: String!
        ) {
          resetPassword(
            resetToken: $resetToken
            newPw: $newPw
            pwFunc: $pwFunc
            pwDigest: $pwDigest
            pwCost: $pwCost
            pwKeySize: $pwKeySize
            pwNonce: $pwNonce
            pubVerifyKey: $pubVerifyKey
            encPrivateSignKey: $encPrivateSignKey
            encSecretKey: $encSecretKey
            pubEncryptKey: $pubEncryptKey
            encPrivateDecryptKey: $encPrivateDecryptKey
          ) {
            jwt
            user {
              uuid
              pwFunc
              pwDigest
              pwCost
              pwKeySize
              pwNonce
              pubVerifyKey
              encPrivateSignKey
              encSecretKey
              pubEncryptKey
              encPrivateDecryptKey
              createdAt
              updatedAt
            }
          }
        }
      `;

      beforeEach(() => {
        sendForgotPasswordSpy.mockReset();
      });

      beforeAll(async () => {
        await getConnection().transaction(async transactionEntityManager => {
          const { u, e } = generateGenericUser("resetPass");
          resetPassUser = await transactionEntityManager.save(u);
          e.user = resetPassUser;
          e.verified = false;
          resetPassEmail = await transactionEntityManager.save(e);
        });
        const jwt = Auth.signUserJWT(resetPassUser);
        const { s, g } = generateGraphQLClients(userTestPort, jwt);
        gqlClient = g;
        subscriptionClient = s;
        sendForgotPasswordSpy = jest.spyOn(Mailer, "sendForgotPasswordEmail");
      });

      afterAll(async () => {
        sendForgotPasswordSpy.mockRestore();
        await getConnection()
          .getRepository(User)
          .delete(resetPassUser);
        subscriptionClient.close();
      });

      it("should handle the forgot > reset password flow.", async () => {
        expect.assertions(31);
        const sendForgotPasswordEmailResponse = await gqlClient.mutate<{
          sendForgotPasswordEmail: boolean;
        }>({
          mutation: sendForgotPasswordEmailMutation,
          variables: { email: resetPassEmail.email }
        });
        expect(sendForgotPasswordEmailResponse).toHaveProperty("data");
        const sendForgotPasswordEmailData =
          sendForgotPasswordEmailResponse.data;
        expect(sendForgotPasswordEmailData).toHaveProperty(
          "sendForgotPasswordEmail",
          true
        );
        expect(sendForgotPasswordSpy).toHaveBeenCalledTimes(1);
        const sendEmailParams = sendForgotPasswordSpy.mock.calls[0];
        expect(sendEmailParams[0]).toEqual(resetPassUser.username);
        expect(sendEmailParams[1]).toEqual(resetPassEmail.email);
        expect(sendEmailParams[2]).toMatch(
          new RegExp(`^${resetPassUser.lUsername}:.*`)
        );
        const resetToken = sendEmailParams[2];
        const checkResetTokenQueryResponse = await gqlClient.query<{
          checkResetToken: {
            isValid: boolean;
            expiry: number;
          };
        }>({
          query: checkResetTokenQuery,
          variables: { resetToken }
        });
        expect(checkResetTokenQueryResponse).toHaveProperty("data");
        const checkResetTokenQueryData = checkResetTokenQueryResponse.data;
        expect(checkResetTokenQueryData).toHaveProperty("checkResetToken");
        const checkResetToken = checkResetTokenQueryData.checkResetToken;

        expect(checkResetToken).toHaveProperty("__typename", "TokenValidity");
        expect(checkResetToken).toHaveProperty("isValid", true);
        expect(checkResetToken).toHaveProperty("expiry");

        const params = generateUserCryptoParams(
          resetPassEmail.email,
          "new pass/lost data"
        );
        const newPw = params.pw;
        delete params.ak;
        delete params.mk;
        delete params.pw;

        const resetPasswordResponse = await gqlClient.mutate<{
          resetPassword: { jwt: string; user: IFullUser };
        }>({
          mutation: resetPasswordMutation,
          variables: {
            resetToken,
            newPw,
            ...params
          }
        });
        expect(resetPasswordResponse).toHaveProperty("data");
        const resetPasswordData = resetPasswordResponse.data!;
        expect(resetPasswordData).toHaveProperty("resetPassword");
        const resetPassword = resetPasswordData.resetPassword;

        expect(resetPassword).toHaveProperty("__typename", "UserAuthPayload");
        expect(resetPassword).toHaveProperty("jwt");
        expect(resetPassword).toHaveProperty("user");
        const user = resetPassword.user;

        expect(user).toHaveProperty("__typename", "FullUser");
        expect(user).toHaveProperty("uuid", resetPassUser.uuid);
        expect(user).toHaveProperty("pwFunc", params.pwFunc);
        expect(user).toHaveProperty("pwDigest", params.pwDigest);
        expect(user).toHaveProperty("pwCost", params.pwCost);
        expect(user).toHaveProperty("pwKeySize", params.pwKeySize);
        expect(user).toHaveProperty("pwNonce", params.pwNonce);
        expect(user).toHaveProperty("pubVerifyKey", params.pubVerifyKey);
        expect(user).toHaveProperty(
          "encPrivateSignKey",
          params.encPrivateSignKey
        );
        expect(user).toHaveProperty("encSecretKey", params.encSecretKey);
        expect(user).toHaveProperty("pubEncryptKey", params.pubEncryptKey);
        expect(user).toHaveProperty(
          "encPrivateDecryptKey",
          params.encPrivateDecryptKey
        );
        expect(user).toHaveProperty(
          "createdAt",
          resetPassUser.createdAt.getTime()
        );
        expect(user).toHaveProperty("updatedAt");
        expect(user.updatedAt).toBeGreaterThan(
          resetPassUser.updatedAt.getTime()
        );
      });

      it("should handle email send rate limit", async () => {
        expect.assertions(5);
        const rateLimitEmail: UserEmail = new UserEmail();
        rateLimitEmail.email = "resetEmailRate@udia.ca";
        rateLimitEmail.lEmail = "resetemailrate@udia.ca";
        rateLimitEmail.user = resetPassUser;
        await getConnection()
          .getRepository(UserEmail)
          .save(rateLimitEmail);
        const sendEmailVerificationResp = await gqlClient.mutate<{
          sendForgotPasswordEmail: boolean;
        }>({
          mutation: sendForgotPasswordEmailMutation,
          variables: { email: rateLimitEmail.email }
        });
        expect(sendEmailVerificationResp).toHaveProperty("data");
        const sendEmailVerificationData = sendEmailVerificationResp.data;
        expect(sendEmailVerificationData).toHaveProperty(
          "sendForgotPasswordEmail",
          true
        );
        expect(sendForgotPasswordSpy).toHaveBeenCalledTimes(1);
        sendForgotPasswordSpy.mockClear();
        try {
          await gqlClient.mutate({
            mutation: sendForgotPasswordEmailMutation,
            variables: { email: rateLimitEmail.email }
          });
        } catch (err) {
          expect(err).toHaveProperty(
            "message",
            `GraphQL error: The request is invalid.\n` +
              `* email: Email sent within last 15 minutes. Wait 14 minutes, 59 seconds.`
          );
        } finally {
          expect(sendForgotPasswordSpy).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe("deleteUser", () => {
      const deleteUserEmail = "deleteUserTest@udia.ca";
      const deleteUserUIP = "deleteUserTest Test!^123";
      const { pw } = generateUserCryptoParams(deleteUserEmail, deleteUserUIP);
      let deleteUser: User;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      const mutation = gql`
        mutation DeleteUser($pw: String!) {
          deleteUser(pw: $pw)
        }
      `;

      beforeAll(async () => {
        const pwHash = await Auth.hashPassword(pw);
        await getConnection().transaction(async transactionEntityManager => {
          const { u, e } = generateGenericUser("deleteUserTest");
          u.pwHash = pwHash;
          deleteUser = await transactionEntityManager.save(u);
          e.user = deleteUser;
          await transactionEntityManager.save(e);
        });
        const jwt = Auth.signUserJWT(deleteUser);
        const { s, g } = generateGraphQLClients(userTestPort, jwt);
        gqlClient = g;
        subscriptionClient = s;
      });

      afterAll(async () => {
        await getConnection()
          .getRepository(User)
          .delete(deleteUser); // cleanup, just in case?
        subscriptionClient.close();
      });

      it("should delete a user", async () => {
        expect.assertions(2);
        const deleteUserMutationResponse = await gqlClient.mutate<{
          deleteUser: boolean;
        }>({
          mutation,
          variables: { pw }
        });
        expect(deleteUserMutationResponse).toEqual({
          data: { deleteUser: true }
        });
        const user = await getConnection()
          .getRepository(User)
          .findOne(deleteUser.uuid);
        expect(user).toBeUndefined();
      });
    });

    describe("refreshJWT", () => {
      let refreshJWTUser: User;
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      const mutation = gql`
        mutation RefreshJWT {
          refreshJWT
        }
      `;

      beforeAll(async () => {
        await getConnection().transaction(async transactionEntityManager => {
          const { u, e } = generateGenericUser("refreshJWT");
          refreshJWTUser = await transactionEntityManager.save(u);
          e.user = refreshJWTUser;
          await transactionEntityManager.save(e);
        });
        const jwt = Auth.signUserJWT(refreshJWTUser);
        const { s, g } = generateGraphQLClients(userTestPort, jwt);
        gqlClient = g;
        subscriptionClient = s;
      });

      afterAll(async () => {
        await getConnection()
          .getRepository(User)
          .delete(refreshJWTUser);
        subscriptionClient.close();
      });

      it("should refresh a user's JSON Web Token", async done => {
        expect.assertions(2);
        const refreshJWTResponse = await gqlClient.mutate<{
          refreshJWT: string;
        }>({ mutation });
        expect(refreshJWTResponse).toHaveProperty("data");
        const refreshJWTData = refreshJWTResponse.data!;
        expect(refreshJWTData).toHaveProperty("refreshJWT");
        const freshJWT = refreshJWTData.refreshJWT;
        try {
          const { s: sp, g: gp } = generateGraphQLClients(
            userTestPort,
            freshJWT
          );
          sp.close();
          await gp.mutate({ mutation });
        } catch {
          done("Refreshed JWT was invalid!");
        } finally {
          done();
        }
      });
    });

    describe("getUsers", () => {
      const testUsers: User[] = [];
      let gqlClient: ApolloClient<NormalizedCacheObject>;
      let subscriptionClient: SubscriptionClient;
      const query = gql`
        query GetUsers($params: UserPaginationInput) {
          getUsers(params: $params) {
            count
            users {
              uuid
              username
              createdAt
              pubVerifyKey
              pubEncryptKey
            }
          }
        }
      `;

      beforeAll(async () => {
        // Generate twenty users named testGetUsers1 to testGetUsers20
        for (let i = 1; i <= 20; i++) {
          await getConnection().transaction(async transactionEntityManager => {
            const { u, e } = generateGenericUser(`testGetUsers${i}`);
            u.pubEncryptKey += i;
            u.pubVerifyKey += i;
            const savedUser = await transactionEntityManager.save(u);
            e.user = savedUser;
            await transactionEntityManager.save(e);
            // sleep for 10ms to ensure no overlap on keyset pagination
            await new Promise(done => setTimeout(done, 10));
            testUsers.push(u);
          });
        }
        const { s, g } = generateGraphQLClients(userTestPort);
        gqlClient = g;
        subscriptionClient = s;
      });

      afterAll(async () => {
        await getConnection()
          .getRepository(User)
          .delete(testUsers.map(u => u.uuid));
        subscriptionClient.close();
      });

      it("should get paginated users", async () => {
        expect.assertions(127);
        const getUsersQueryResponse = await gqlClient.query<{
          getUsers: {
            count: number;
            users: IFullUser[]; // really not the full user, but whatever
          };
        }>({
          query,
          variables: {
            params: {
              usernameLike: "testGetUsers%",
              usernameNotLike: "%14",
              limit: 13,
              order: "ASC"
            }
          }
        });
        expect(getUsersQueryResponse).toHaveProperty("data");
        const getUsersData = getUsersQueryResponse.data;
        expect(getUsersData).toHaveProperty("getUsers");
        const getUsers = getUsersData.getUsers;
        expect(getUsers).toHaveProperty("__typename", "UserPagination");
        expect(getUsers).toHaveProperty("count", 19);
        expect(getUsers).toHaveProperty("users");
        const usersPage = getUsers.users;
        expect(usersPage).toHaveLength(13);
        for (let i = 0; i < usersPage.length; i++) {
          expect(usersPage[i]).toHaveProperty("__typename", "User");
          expect(usersPage[i]).toHaveProperty(
            "username",
            testUsers[i].username
          );
          expect(usersPage[i]).toHaveProperty("uuid", testUsers[i].uuid);
          expect(usersPage[i]).toHaveProperty(
            "createdAt",
            testUsers[i].createdAt.getTime()
          );
          expect(usersPage[i]).toHaveProperty(
            "pubVerifyKey",
            testUsers[i].pubVerifyKey
          );
          expect(usersPage[i]).toHaveProperty(
            "pubEncryptKey",
            testUsers[i].pubEncryptKey
          );
        }
        // Get next page
        const getUsersNextQueryResponse = await gqlClient.query<{
          getUsers: {
            count: number;
            users: IFullUser[]; // really not the full user, but whatever
          };
        }>({
          query,
          variables: {
            params: {
              usernameLike: "testGetUsers%",
              usernameNotLike: "%14",
              datetime: new Date(usersPage[usersPage.length - 1].createdAt),
              order: "ASC"
            }
          }
        });
        expect(getUsersNextQueryResponse).toHaveProperty("data");
        const getUsersNextData = getUsersNextQueryResponse.data;
        expect(getUsersNextData).toHaveProperty("getUsers");
        const getNextUsers = getUsersNextData.getUsers;
        expect(getNextUsers).toHaveProperty("__typename", "UserPagination");
        expect(getNextUsers).toHaveProperty("count", 6);
        expect(getNextUsers).toHaveProperty("users");
        const usersNextPage = getNextUsers.users;

        // check no overlap! This caught typeorm timestamp precision bug
        expect(usersNextPage[0].username).not.toEqual(
          usersPage[usersPage.length - 1].username
        );

        expect(usersNextPage).toHaveLength(6);
        const offset = 14; // Skip user 14 as defined in query params
        for (let i = 0; i < usersNextPage.length; i++) {
          expect(usersNextPage[i]).toHaveProperty("__typename", "User");
          expect(usersNextPage[i]).toHaveProperty(
            "username",
            testUsers[i + offset].username
          );
          expect(usersNextPage[i]).toHaveProperty(
            "uuid",
            testUsers[i + offset].uuid
          );
          expect(usersNextPage[i]).toHaveProperty(
            "createdAt",
            testUsers[i + offset].createdAt.getTime()
          );
          expect(usersNextPage[i]).toHaveProperty(
            "pubVerifyKey",
            testUsers[i + offset].pubVerifyKey
          );
          expect(usersNextPage[i]).toHaveProperty(
            "pubEncryptKey",
            testUsers[i + offset].pubEncryptKey
          );
        }
      });

      it("should return values with no parameters set", async () => {
        expect.assertions(3);
        const getUsersQueryResponse = await gqlClient.query<{
          getUsers: {
            count: number;
            users: IFullUser[]; // really not the full user, but whatever
          };
        }>({
          query
        });
        expect(getUsersQueryResponse).toHaveProperty("data");
        const {
          getUsers: { count, users }
        } = getUsersQueryResponse.data;
        expect(count).toBeGreaterThanOrEqual(20);
        expect(users).toHaveLength(10); // default limit
      });
    });
  });

  describe("User/FullUser Resolver", () => {
    let resolveUser: User;
    let resolveItem: Item;
    let gqlClient: ApolloClient<NormalizedCacheObject>;
    let subscriptionClient: SubscriptionClient;
    const query = gql`
      query Me {
        me {
          uuid
          items {
            count
            items {
              uuid
              content
              contentType
              encItemKey
              user {
                uuid
                items {
                  count
                  items {
                    uuid
                    content
                    contentType
                    encItemKey
                  }
                }
              }
            }
          }
        }
      }
    `;

    beforeAll(async () => {
      await getConnection().transaction(async transactionEntityManager => {
        const { u, e } = generateGenericUser("resolveUser");
        resolveUser = await transactionEntityManager.save(u);
        e.user = resolveUser;
        await transactionEntityManager.save(e);
      });
      const jwt = Auth.signUserJWT(resolveUser);
      const { s, g } = generateGraphQLClients(userTestPort, jwt);
      resolveItem = await ItemManager.createItem(resolveUser.uuid, {
        content: "test resolve user items",
        contentType: "plaintext",
        encItemKey: "unencrypted"
      });
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(async () => {
      await getConnection()
        .getRepository(User)
        .delete(resolveUser);
      await getConnection()
        .getRepository(Item)
        .delete(resolveItem);
      subscriptionClient.close();
    });

    it("should return a user's items", async () => {
      expect.assertions(27);
      const userResolveQueryResponse = await gqlClient.query({ query });
      expect(userResolveQueryResponse).toHaveProperty("data");
      const userResolveData: any = userResolveQueryResponse.data;
      expect(userResolveData).toHaveProperty("me");

      const meData = userResolveData.me;
      expect(meData).toHaveProperty("__typename", "FullUser");
      expect(meData).toHaveProperty("uuid", resolveUser.uuid);
      expect(meData).toHaveProperty("items");
      const fuItemPagination = meData.items;
      expect(fuItemPagination).toHaveProperty("__typename", "ItemPagination");
      expect(fuItemPagination).toHaveProperty("count", 1);
      expect(fuItemPagination).toHaveProperty("items");
      const fuItems = fuItemPagination.items;
      expect(fuItems).toHaveLength(1);
      const fullUserItem = fuItems[0];
      expect(fullUserItem).toHaveProperty("__typename", "Item");
      expect(fullUserItem).toHaveProperty("uuid", resolveItem.uuid);
      expect(fullUserItem).toHaveProperty("content", resolveItem.content);
      expect(fullUserItem).toHaveProperty(
        "contentType",
        resolveItem.contentType
      );
      expect(fullUserItem).toHaveProperty("encItemKey", resolveItem.encItemKey);
      expect(fullUserItem).toHaveProperty("user");
      const uData = fullUserItem.user;
      expect(uData).toHaveProperty("__typename", "User");
      expect(uData).toHaveProperty("uuid", resolveUser.uuid);
      expect(uData).toHaveProperty("items");
      const uItemPagination = uData.items;
      expect(uItemPagination).toHaveProperty("__typename", "ItemPagination");
      expect(uItemPagination).toHaveProperty("count", 1);
      expect(uItemPagination).toHaveProperty("items");
      const uItems = uItemPagination.items;
      expect(uItems).toHaveLength(1);
      const userItem = fuItems[0];
      expect(userItem).toHaveProperty("__typename", "Item");
      expect(userItem).toHaveProperty("uuid", resolveItem.uuid);
      expect(userItem).toHaveProperty("content", resolveItem.content);
      expect(userItem).toHaveProperty("contentType", resolveItem.contentType);
      expect(userItem).toHaveProperty("encItemKey", resolveItem.encItemKey);
    });
  });
});
