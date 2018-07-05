import PostgresPubSub from "@udia/graphql-postgres-subscriptions";
import crypto from "crypto";
import { existsSync, mkdir } from "fs";
import { execute, subscribe } from "graphql";
import { PubSubEngine } from "graphql-subscriptions";
import { createServer, Server } from "http";
import Graceful from "node-graceful";
import { Client } from "pg";
import "reflect-metadata"; // required for typeorm
import { ServerOptions, SubscriptionServer } from "subscriptions-transport-ws";
import { createConnection, getConnectionOptions } from "typeorm";
import app from "./app";
import {
  APP_VERSION,
  HEALTH_METRIC_INTERVAL,
  LOG_DIR,
  NODE_ENV,
  PORT,
  SQL_DB,
  SQL_HOST,
  SQL_PASSWORD,
  SQL_PORT,
  SQL_USER
} from "./constants";
import gqlSchema from "./gqlSchema";
import Auth from "./modules/Auth";
import { PostgresConnectionOptions } from "./types/typeormOpts";
import logger, { TypeORMLogger } from "./util/logger";
import metric from "./util/metric";

let pubSub: PubSubEngine;
const dateReviver = (key: any, value: any) => {
  const ISO8601Z = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
  if (typeof value === "string" && ISO8601Z.test(value)) {
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
const start: (port: string) => Promise<Server> = async (port: string) => {
  const { nodeVersion, arch, platform, release } = metric();
  logger.info(`NodeJS ${nodeVersion} Arch ${arch} on ${platform} ${release}.`);
  /* istanbul ignore next: we don't care about log dir init in test */
  if (!existsSync(LOG_DIR)) {
    // If the log directory does not exist, create it
    await new Promise(resolve => mkdir(LOG_DIR, resolve));
  }
  // crypto module may not exist in node binary (will throw error)
  app.set("crypto", crypto);

  // create db connection using /ormconfig.js
  const connectionOptions = await getConnectionOptions();
  Object.assign(connectionOptions, { logger: new TypeORMLogger() });
  const conn = await createConnection(connectionOptions);
  const {
    username,
    host,
    port: dbport,
    database,
    type
  } = conn.options as PostgresConnectionOptions;
  logger.info(
    `Connected to ${type} DB ${database} at ${username}@${host}:${dbport}.`
  );
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
      schema: gqlSchema,
      onConnect: (connectionParams: ServerOptions | any) => {
        const { authorization: jwt } = connectionParams;
        if (jwt) {
          const payload = Auth.verifyUserJWT(jwt);
          return { user: payload };
        }
        return {};
      }
    },
    {
      server,
      path: "/subscriptions"
    }
  );

  let metricSubscriptionInterval: NodeJS.Timer;
  server.listen(port, async () => {
    logger.info(
      `UDIA ${NODE_ENV} v${APP_VERSION} server running on port ${port}.`
    );
    metricSubscriptionInterval = setInterval(() => {
      pubSub.publish("health", { health: metric() });
    }, +HEALTH_METRIC_INTERVAL);
  });

  const shutdownListener = (done: () => void, event: any, signal: any) => {
    logger.warn(`!)\tGraceful ${signal} signal received.`);
    return new Promise(resolve => {
      logger.warn(`4)\tHTTP & WebSocket servers on port ${port} closing.`);
      clearInterval(metricSubscriptionInterval);
      subscriptionServer.close();
      return server.close(resolve);
    })
      .then(() => {
        logger.warn(`3)\tDatabase clients ending.`);
        return pgClient.end();
      })
      .then(() => {
        logger.warn(`2)\tDatabase connections closing.`);
        return conn.close();
      })
      .then(() => {
        logger.warn(`1)\tShutting down. Goodbye!\n`);
        return done();
      })
      .catch(
        /* istanbul ignore next: don't care about nongraceful test shutdown */
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

/* istanbul ignore next: test coverage never runs `node index` */
if (require.main === module) {
  start(PORT);
}

export { pubSub, dateReviver };
export default start;
