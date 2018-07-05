import axios, { AxiosInstance } from "axios";
import Graceful from "node-graceful";
import { PORT } from "../constants";
import start, { dateReviver } from "../index";

describe("Index", () => {
  // Ports are staggered to prevent multiple tests from clobbering
  // Index is special in that the server close uses Graceful's interrupt instead of callback
  const indexTestPort = `${parseInt(PORT, 10) + 1}`;
  let restClient: AxiosInstance;

  beforeAll(async () => {
    await start(indexTestPort);
    restClient = axios.create({ baseURL: `http://0.0.0.0:${indexTestPort}` });
  });

  afterAll(async () => {
    // testing the graceful shutdown logic
    Graceful.exit(0, "shutdown");
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it("should query the `/` endpoint", async () => {
    expect.assertions(1);
    const getIndexResp = await restClient.get("/");
    const indexRespData = getIndexResp.data || "";
    expect(indexRespData).toContain("UDIA API SERVER");
  });

  it("should revive JSON.stringify dates", () => {
    expect.assertions(4);
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
