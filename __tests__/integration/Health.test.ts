import axios, { AxiosInstance } from "axios";
import { Server } from "http";
import { PORT } from "../../src/constants";
import start from "../../src/index";

let server: Server = null;
let restClient: AxiosInstance = null;

beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  const healthTestPort = parseInt(PORT, 10) + 2;
  server = await start(healthTestPort);
  restClient = axios.create({ baseURL: `http://0.0.0.0:${healthTestPort}` });
  done();
});

afterAll(async done => {
  await server.close()
  done();
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
})