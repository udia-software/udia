import crypto from "crypto";
import { execute, subscribe } from "graphql";
import { createServer } from "http";
import Graceful from "node-graceful";
import "reflect-metadata";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { createConnection } from "typeorm";
import app from "./app";
import { HEALTH_METRIC_INTERVAL, NODE_ENV, PORT } from "./constants";
import gqlSchema from "./gqlSchema";
import pubSub from "./pubSub";
import logger from "./util/logger";
import { metric } from "./util/metric";

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

  let metricSubscriptionInterval: NodeJS.Timer;
  server.listen(port, async () => {
    logger.info(`UDIA ${NODE_ENV} server running on port ${port}.`);
    metricSubscriptionInterval = setInterval(() => {
      const healthMetric = metric();
      pubSub.publish("HealthMetric", {
        HealthMetricSubscription: { ...healthMetric }
      });
    }, +HEALTH_METRIC_INTERVAL);
  });

  const shutdownListener = (done: () => void, event: any, signal: any) => {
    logger.warn(`!)\tGraceful ${signal} signal received.`);
    return new Promise(resolve => {
      logger.warn(`3)\tHTTP & WebSocket servers closing.`);
      clearInterval(metricSubscriptionInterval);
      subscriptionServer.close();
      return server.close(resolve);
    })
      .then(() => {
        logger.warn(`2)\tDatabase connection closing.`);
        return conn.close();
      })
      .then(() => {
        logger.warn(`1)\tShutting down.`);
        return done();
      })
      .catch(
        /* istanbul ignore next */
        err => {
          logger.error("!)\tTERMERR\n", err);
          process.exit(1);
        }
      );
  };
  // Graceful.on("exit", shutdownListener, true); // broken. use SIG* instead
  Graceful.on("SIGTERM", shutdownListener, true);
  Graceful.on("SIGINT", shutdownListener, true);
  Graceful.on("SIGBREAK", shutdownListener, true);
  Graceful.on("SIGHUP", shutdownListener, true);
  Graceful.on("SIGUSR2", shutdownListener, true); // nodemon
  Graceful.on("shutdown", shutdownListener, false); // tests
  return server;
};

/* istanbul ignore next */
if (require.main === module) {
  start(PORT);
}

export default start;
