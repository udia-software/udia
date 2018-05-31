import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink, split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getOperationDefinition } from "apollo-utilities";
import crypto from "crypto";
import fetch from "node-fetch";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { createSecureContext } from "tls";
import WebSocket from "ws";
import { User } from "../src/entity/User";
import { UserEmail } from "../src/entity/UserEmail";

interface ILoginParams {
  uip: string;
  pwCost: number;
  pwSalt: string;
  pwFunc: string;
  pwDigest: string;
  pwKeySize: number;
}

/**
 * Generate pseudo crypto parameters for tests only
 * Keys generated by this method are not suitable for actual encryption
 * @param {string} email - email for user
 * @param {string} uip - user inputted password
 */
export function generateUserCryptoParams(email: string, uip: string) {
  const pwFunc = "pbkdf2"; // not the same as webcrypto
  const pwDigest = "sha512"; // not the same as webcrypto
  const pwCost = 3000; // should be 100000 in production environments
  const pwKeySize = 768; // should be divisible by 3
  const pwNonce = crypto.randomBytes(256).toString("base64"); // random nonce

  const hash = crypto.createHash("sha1");
  hash.update([email, pwNonce].join(":"));
  const pwSalt = hash.digest("hex");

  // Derive the three keys
  const { pw, mk, ak } = deriveSubKeysFromUserInputPassword({
    uip,
    pwCost,
    pwSalt,
    pwFunc,
    pwDigest,
    pwKeySize
  });
  // generate unusable keys for test placeholder purposes
  const {
    publicKey: pubSignKey,
    privateKey: encPrivSignKey
  } = generateKeyPairECDH();
  const {
    publicKey: pubEncKey,
    privateKey: encPrivEncKey
  } = generateKeyPairECDH();
  const encSecretKey = crypto.randomBytes(256).toString("base64");
  return {
    pw,
    mk,
    ak,
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
  };
}

/**
 * Derive the three sub keys given the user inputted password and options
 * @param {ILoginParams} - Options for deriving the three keys
 */
export function deriveSubKeysFromUserInputPassword({
  uip,
  pwCost,
  pwSalt,
  pwFunc,
  pwDigest,
  pwKeySize
}: ILoginParams) {
  if (pwFunc !== "pbkdf2") {
    throw new Error(`Unsupported password function ${pwFunc}`);
  }
  const key = crypto.pbkdf2Sync(uip, pwSalt, pwCost, pwKeySize, pwDigest);
  const pw = key.slice(0, key.length / 3).toString("hex");
  const mk = key.slice(key.length / 3, key.length / 3 * 2).toString("hex");
  const ak = key.slice(key.length / 3 * 2, key.length).toString("hex");
  return { pw, mk, ak };
}

/**
 * Helper function for generating elliptic curve diffie hellman keys.
 * Not sure what this is going to be used for yet.
 */
export function generateKeyPairECDH() {
  const ecdh = crypto.createECDH("prime256v1");
  const publicKey = ecdh.generateKeys("hex", "uncompressed");
  const privateKey = ecdh.getPrivateKey("hex");
  return { ecdh, publicKey, privateKey };
}

/**
 * Helper function to instantiate a graphQL client and subscription client
 * @param {string} port - String value of the server port
 * @param {string} jwt - Optional, what JWT to authenticate with
 */
export function generateGraphQLClients(port: string, jwt?: string) {
  const GRAPHQL_HTTP_ENDPOINT = `http://0.0.0.0:${port}/graphql`;
  const GRAPHQL_SUBSCRIPTIONS_ENDPOINT = `ws://0.0.0.0:${port}/subscriptions`;

  const authorizationHeader = jwt ? `Bearer ${jwt}` : "";
  const middlewareAuthLink = new ApolloLink((operation, forward) => {
    operation.setContext({ headers: { authorization: authorizationHeader } });
    return forward(operation);
  });

  const httpLinkWithAuthToken = middlewareAuthLink.concat(
    // https://github.com/apollographql/apollo-link/issues/513
    new HttpLink({ uri: GRAPHQL_HTTP_ENDPOINT, fetch: fetch as any })
  );

  const subscriptionClient = new SubscriptionClient(
    GRAPHQL_SUBSCRIPTIONS_ENDPOINT,
    {
      reconnect: true,
      connectionParams: { authorization: jwt }
    },
    WebSocket
  );
  const wsLinkWithAuthToken = new WebSocketLink(subscriptionClient);
  const link = split(
    ({ query }) => {
      // TODO https://github.com/apollographql/apollo-link/issues/601
      const { kind, operation } = getOperationDefinition(query as any) || {
        kind: null,
        operation: null
      };
      return kind === "OperationDefinition" && operation === "subscription";
    },
    wsLinkWithAuthToken,
    httpLinkWithAuthToken
  );
  const gqlClient = new ApolloClient({
    link,
    cache: new InMemoryCache()
  });

  return { s: subscriptionClient, g: gqlClient };
}

/**
 * Helper function to generate a test user and test user email instance pair.
 * Will not be saved in the database (object instance stub only).
 * Email will be in the form ${username}@udia.ca.
 * @param {string} username - What is the username of the test user
 * @param {object} override - Override the user fields with these variables.
 */
export function generateGenericUser(username: string) {
  const user = new User();
  const email = new UserEmail();
  email.email = `${username.trim()}@udia.ca`;
  email.lEmail = `${username.trim().toLowerCase()}@udia.ca`;
  email.primary = true;
  email.verified = true;
  user.username = username.trim();
  user.lUsername = username.trim().toLowerCase();
  user.pubSignKey = JSON.stringify({ kty: "invalidkey" });
  user.encPrivSignKey = "dummyivbase64enc.dummyencprivsignkeybase64enc";
  user.encSecretKey = "dummyivbase64enc.dummyencsecretkeybase64enc";
  user.pubEncKey = JSON.stringify({ kty: "invalidkey" });
  user.encPrivEncKey = "dummyivbase64enc.dummyencprivenckeybase64enc";
  user.pwHash = "$argon2i$v=1$m=1,t=1,p=1$101";
  user.pwFunc = "PBKDF2";
  user.pwDigest = "SHA-512";
  user.pwCost = 100000;
  user.pwKeySize = 768;
  user.pwSalt = "testsalt";
  return { u: user, e: email };
}
