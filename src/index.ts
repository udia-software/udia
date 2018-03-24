import crypto from "crypto";
import { createServer } from "http";
import Graceful from "node-graceful";
import { createConnection } from "typeorm";
import app from "./app";
import { NODE_ENV, PORT } from "./constants";
import logger from "./util/logger";

/**
 * Start the server. Initialize the Database Client and tables.
 * Throws an error if client initialization fails
 */
const start = async () => {
  // crypto module may not exist in node binary (will throw error)
  app.set("crypto", crypto);

  // db not be available (will throw error)
  const conn = await createConnection();
  logger.info(`Connected to ${conn.options.database} ${conn.options.type}.`);
  app.set("dbConnection", conn);
  const server = createServer(app);

  server.listen(PORT, async () => {
    logger.info(`UDIA ${NODE_ENV} server running on port ${PORT}.`);
  });

  Graceful.on("exit", (done, event, signal) => {
    logger.warn(`3)\tGraceful ${signal} signal received.`);
    server.close(() => {
      logger.warn(`2)\tHTTP server closed.`);
      conn.close().then(() => {
        logger.warn(`1)\tDatabase connections closed.`);
        done();
      });
    });
  });

  return server;
};

if (require.main === module) {
  start();
}

export default start;
