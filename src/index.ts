import { createServer } from "http";
import app from "./app";
import { NODE_ENV, PORT } from "./constants";
import dbPool from "./db/dbPool";

/**
 * Start the server. Initialize the Database Client and tables.
 */
const start = async () => {
  const pool = await dbPool.connect();

  app.set("dbPool", pool);
  const server = createServer(app);

  server.listen(PORT, async () => {
    // tslint:disable-next-line no-console
    console.log(`UDIA ${NODE_ENV} server running on port ${PORT}`);
  });

  server.on("close", async () => {
    // tslint:disable-next-line no-console
    console.log(`UDIA server shutting down...`);
    await dbPool.end();
  });
};

if (require.main === module) {
  start();
}

export default start;
