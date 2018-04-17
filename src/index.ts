import crypto from "crypto";
import { execute, subscribe } from "graphql";
import { createServer } from "http";
import Graceful from "node-graceful";
import "reflect-metadata";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { createConnection } from "typeorm";
import app from "./app";
import { NODE_ENV, PORT } from "./constants";
import gqlSchema from "./gqlSchema";
import logger from "./util/logger";

/**
 * Start the server. Initialize the Database Client and tables.
 * Throws an error if client initialization fails
 */
const start = async (port: string) => {
  // crypto module may not exist in node binary (will throw error)
  app.set("crypto", crypto);

  // db not be available (will throw error)
  const conn = await createConnection();
  logger.info(`Connected to ${conn.options.database} ${conn.options.type}.`);
  app.set("dbConnection", conn);
  const server = createServer(app);
  const subscriptionServer = SubscriptionServer.create(
    {
      execute,
      subscribe,
      schema: gqlSchema
    },
    {
      server,
      path: "/subscriptions"
    }
  );

  server.listen(port, async () => {
    logger.info(`UDIA ${NODE_ENV} server running on port ${port}.`);
  });

  const shutdownListener = (done: () => void, event: any, signal: any) => {
    logger.warn(`3)\tGraceful ${signal} signal received.`);
    subscriptionServer.close();
    server.close(() => {
      logger.warn(`2)\tHTTP & WebSocket servers closed.`);
      conn.close().then(() => {
        logger.warn(`1)\tDatabase connection closed.`);
        done();
      });
    });
  };
  Graceful.on("exit", shutdownListener);
  Graceful.on("shutdown", shutdownListener);
  return server;
};

/* istanbul ignore next */
if (require.main === module) {
  start(PORT);
}

export default start;
