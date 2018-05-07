import PostgresPubSub from "@udia/graphql-postgres-subscriptions";
import crypto from "crypto";
import { execute, subscribe } from "graphql";
import { PubSubEngine } from "graphql-subscriptions";
import { createServer } from "http";
import Graceful from "node-graceful";
import { Client } from "pg";
import "reflect-metadata"; // required for typeorm
import { SubscriptionServer } from "subscriptions-transport-ws";
import { createConnection } from "typeorm";
import app from "./app";
import {
  HEALTH_METRIC_INTERVAL,
  NODE_ENV,
  PORT,
  SQL_DB,
  SQL_HOST,
  SQL_PASSWORD,
  SQL_PORT,
  SQL_USER
} from "./constants";
import gqlSchema from "./gqlSchema";
import logger from "./util/logger";
import metric from "./util/metric";

let pubSub: PubSubEngine;
const dateReviver = (key: any, value: any) => {
  const isISO8601Z = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
  if (typeof value === "string" && isISO8601Z.test(value)) {
    const tempDateNumber = Date.parse(value);
    if (!isNaN(tempDateNumber)) {
      return new Date(tempDateNumber);
    }
  }
  return value;
};

/**
 * Start the server. Initialize the Database Client and tables.
 * Throws an error if client initialization fails
 */
const start = async (port: string) => {
  // crypto module may not exist in node binary (will throw error)
  app.set("crypto", crypto);

  // create db connection using /ormconfig.js
  const conn = await createConnection();
  logger.info(`Connected to ${conn.options.database} ${conn.options.type}.`);
  app.set("dbConnection", conn);

  // instantiate native postgres client for PubSub
  const pgClient = new Client({
    user: SQL_USER,
    database: SQL_DB,
    password: SQL_PASSWORD,
    port: +SQL_PORT,
    host: SQL_HOST
  });
  await pgClient.connect();
  pubSub = new PostgresPubSub(pgClient, dateReviver);
  app.set("pubSub", pubSub);

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
      pubSub.publish("health", { health: metric() });
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
        logger.warn(`2)\tDatabase connections closing.`);
        return conn.close();
      })
      .then(() => {
        return pgClient.end();
      })
      .then(() => {
        logger.warn(`1)\tShutting down. Goodbye!`);
        return done();
      })
      .catch(
        // coverage don't care about nongraceful shutdowns in test
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

// test coverage will never run `node index`
/* istanbul ignore next */
if (require.main === module) {
  start(PORT);
}

export { pubSub, dateReviver };
export default start;
