import start from "../src/index";

describe("Index", () => {
  it("should initialize the server without crashing", async done => {
    const server = await start();
    setTimeout(async () => {
      await server.close();
      done();
    }, 10);
  });
});
