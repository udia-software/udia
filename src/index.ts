import { createServer } from "http";
import app from "./app";
import { NODE_ENV, PORT } from "./constants";
import database from "./database";

/**
 * Start the server. Initialize the Database Client.
 */
const start = async () => {
  await database.connect();
  const server = createServer(app);

  server.listen(PORT, async () => {
    // tslint:disable-next-line no-console
    console.log(`UDIA ${NODE_ENV} server running on port ${PORT}`);
  });

  server.on("close", async () => {
    await database.end();
  });
};

if (require.main === module) {
  start();
}

export default start;
