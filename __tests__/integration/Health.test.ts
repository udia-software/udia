import ApolloClient from "apollo-client";
import axios, { AxiosInstance } from "axios";
import gql from "graphql-tag";
import { Server } from "http";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { PORT } from "../../src/constants";
import start from "../../src/index";
import { generateGraphQLClients } from "../testHelper";

describe("Health", () => {
  // Ports are staggered to prevent multiple tests from clobbering
  const healthTestPort = `${parseInt(PORT, 10) + 2}`;
  let server: Server;

  beforeAll(async () => {
    server = await start(healthTestPort);
  });

  afterAll(async done => {
    server.close(done);
  });

  describe("REST API", () => {
    let restClient: AxiosInstance;

    beforeAll(() => {
      restClient = axios.create({
        baseURL: `http://0.0.0.0:${healthTestPort}`
      });
    });

    it("should query the `/health` endpoint", async () => {
      expect.assertions(15);
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
    });
  });

  describe("GraphQL API", () => {
    let gqlClient: ApolloClient<any>;
    let subscriptionClient: SubscriptionClient;
    const query = gql`
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
    `;

    beforeAll(async () => {
      const { s, g } = generateGraphQLClients(healthTestPort);
      gqlClient = g;
      subscriptionClient = s;
    });

    afterAll(() => {
      subscriptionClient.close();
    });

    it("should query the `/graphql` endpoint", async () => {
      expect.assertions(17);
      const getHealthQueryResp = await gqlClient.query({ query });
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
    });
  });
});
