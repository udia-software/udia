import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloLink, split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getOperationDefinition } from "apollo-utilities";
import axios, { AxiosInstance } from "axios";
import gql from "graphql-tag";
import { Server } from "http";
import fetch from "node-fetch";
import { SubscriptionClient } from "subscriptions-transport-ws";
import WebSocket from "ws";
import { PORT } from "../../src/constants";
import start from "../../src/index";

let server: Server = null;
let restClient: AxiosInstance = null;
let gqlClient: ApolloClient<any> = null;
let subscriptionClient: SubscriptionClient = null;

beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  const healthTestPort = `${parseInt(PORT, 10) + 2}`;
  server = await start(healthTestPort);
  restClient = axios.create({ baseURL: `http://0.0.0.0:${healthTestPort}` });

  const GRAPHQL_HTTP_ENDPOINT = `http://0.0.0.0:${healthTestPort}/graphql`;
  const GRAPHQL_SUBSCRIPTIONS_ENDPOINT = `ws://0.0.0.0:${healthTestPort}/subscriptions`;

  const middlewareAuthLink = new ApolloLink((operation, forward) => {
    operation.setContext({ headers: { authorization: null } });
    return forward(operation);
  });
  const httpLinkWithAuthToken = middlewareAuthLink.concat(
    // TODO https://github.com/apollographql/apollo-link/issues/513
    new HttpLink({ uri: GRAPHQL_HTTP_ENDPOINT, fetch: fetch as any })
  );

  subscriptionClient = new SubscriptionClient(
    GRAPHQL_SUBSCRIPTIONS_ENDPOINT,
    {
      reconnect: true,
      connectionParams: { authorization: null }
    },
    WebSocket
  );
  const wsLinkWithAuthToken = new WebSocketLink(subscriptionClient);
  const link = split(
    ({ query }) => {
      // TODO https://github.com/apollographql/apollo-link/issues/601
      const { kind, operation } = getOperationDefinition((query as any)) || {
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
  done();
});

afterAll(async done => {
  subscriptionClient.close();
  server.close(done);
});

describe("Health", () => {
  it("should query the `/health` endpoint", async done => {
    const getHealthResp = await restClient.get("/health");
    const respData = getHealthResp.data || {};
    expect(respData).toHaveProperty("version");
    expect(respData).toHaveProperty("nodeVersion");
    expect(respData).toHaveProperty("arch");
    expect(respData).toHaveProperty("hostname");
    expect(respData).toHaveProperty("platform");
    expect(respData).toHaveProperty("release");
    expect(respData).toHaveProperty("freememGiB");
    expect(respData).toHaveProperty("totalmemGiB");
    expect(respData).toHaveProperty("freememGB");
    expect(respData).toHaveProperty("totalmemGB");
    expect(respData).toHaveProperty("osUptime");
    expect(respData).toHaveProperty("pUptime");
    expect(respData).toHaveProperty("now");
    expect(respData).toHaveProperty("loadavg");
    expect(respData).toHaveProperty("cpus");
    done();
  });

  it("should query the `/graphql` endpoint", async done => {
    try {
      const getHealthQueryResp = await gqlClient.query({
        query: gql`
          query Health {
            health {
              version
              nodeVersion
              arch
              hostname
              platform
              release
              freememGiB
              totalmemGiB
              freememGB
              totalmemGB
              osUptime
              pUptime
              now
              loadavg
              cpus {
                model
                speed
                times {
                  user
                  nice
                  sys
                  idle
                  irq
                }
              }
            }
          }
        `
      });
      expect(getHealthQueryResp).toHaveProperty("data");
      const getHealthData: any = getHealthQueryResp.data;
      expect(getHealthData).toHaveProperty("health");
      const getHealth = getHealthData.health;
      expect(getHealth).toHaveProperty("version");
      expect(getHealth).toHaveProperty("nodeVersion");
      expect(getHealth).toHaveProperty("arch");
      expect(getHealth).toHaveProperty("hostname");
      expect(getHealth).toHaveProperty("platform");
      expect(getHealth).toHaveProperty("release");
      expect(getHealth).toHaveProperty("freememGiB");
      expect(getHealth).toHaveProperty("totalmemGiB");
      expect(getHealth).toHaveProperty("freememGB");
      expect(getHealth).toHaveProperty("totalmemGB");
      expect(getHealth).toHaveProperty("osUptime");
      expect(getHealth).toHaveProperty("pUptime");
      expect(getHealth).toHaveProperty("now");
      expect(getHealth).toHaveProperty("loadavg");
      expect(getHealth).toHaveProperty("cpus");
      done();
    } catch (err) {
      expect(err).toEqual({});
    }
  });
});
