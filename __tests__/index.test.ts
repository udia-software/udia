import axios, { AxiosInstance } from "axios";
import { Server } from "http";
import Graceful from "node-graceful";
import { PORT } from "../src/constants";
import start, { dateReviver } from "../src/index";

let restClient: AxiosInstance = null;

beforeAll(async done => {
  // Ports are staggered to prevent multiple tests from clobbering
  // Index is special in that it tries the default port first
  const indexTestPort = `${parseInt(PORT, 10) + 4}`;
  const server = await start(indexTestPort);
  restClient = axios.create({ baseURL: `http://0.0.0.0:${indexTestPort}` });
  done();
});

afterAll(async done => {
  // testing the graceful shutdown logic
  Graceful.exit(0, "shutdown");
  await new Promise(resolve => setTimeout(resolve, 100));
  done();
});

describe("Index", () => {
  it("should query the `/` endpoint", async done => {
    const getIndexResp = await restClient.get("/");
    const indexRespData = getIndexResp.data || "";
    expect(indexRespData).toContain("UDIA API SERVER");
    done();
  });

  it("should revive JSON.stringify dates", () => {
    const validTime = new Date();
    const invalidTime = "2018-13-04T21:12:40.913Z"; // 13th month does not exist
    const stringify = JSON.stringify({ validTime, invalidTime });
    const revive = JSON.parse(stringify, dateReviver);
    expect(revive).toHaveProperty("validTime");
    expect(revive).toHaveProperty("invalidTime");
    expect(typeof revive.invalidTime).toBe("string");
    expect(revive.validTime).toBeInstanceOf(Date);
  });
});
