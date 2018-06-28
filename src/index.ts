import PostgresPubSub from "@udia/graphql-postgres-subscriptions";
import cluster from "cluster";
import crypto from "crypto";
import { existsSync, mkdir } from "fs";
import { execute, subscribe } from "graphql";
import { PubSubEngine } from "graphql-subscriptions";
import { createServer, Server } from "http";
import Graceful from "node-graceful";
import { cpus } from "os";
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
  SQL_USER,
  USE_NODE_CLUSTER
} from "./constants";
import gqlSchema from "./gqlSchema";
import Auth from "./modules/Auth";
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
 * Start the application server. Initialize the Database Client and tables.
 * Throws an error if client initialization fails
 */
const start: (port: string) => Promise<Server> = async (port: string) => {
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

    // Only one worker/server should be publishing health events at a time.
    const HEALTH_ADVISORY_LOCK_ID = Number.MIN_SAFE_INTEGER;
    let healthMetricLocked: boolean = false;
    let kludgeBarf = 10;
    metricSubscriptionInterval = setInterval(async () => {
      try {
        if (healthMetricLocked) {
          const queryResp = await pgClient.query({
            text: "SELECT pg_advisory_unlock($1)",
            values: [HEALTH_ADVISORY_LOCK_ID]
          });
          // false means error, not unlocked. Explicitly check !(resp === true);
          const unlockSuccess = queryResp.rows[0].pg_advisory_unlock;
          if (!unlockSuccess) {
            throw queryResp;
          }
          healthMetricLocked = false;
        }
        if (!healthMetricLocked) {
          const queryResp = await pgClient.query({
            text: "SELECT pg_try_advisory_lock($1)",
            values: [HEALTH_ADVISORY_LOCK_ID]
          });
          healthMetricLocked = queryResp.rows[0].pg_try_advisory_lock;
        }
        if (healthMetricLocked) {
          pubSub.publish("health", { health: metric() });
          kludgeBarf -= 1;
          if (!kludgeBarf) {
            throw { kludgeBarf, healthMetricLocked };
          }
        }
      } catch (err) {
        logger.error("UNHEALTHY", err);
        Graceful.exit(1);
      }
    }, +HEALTH_METRIC_INTERVAL);
  });

  const shutdownListener = (done: () => void, event: any, signal: any) => {
    logger.warn(`!)\tGraceful ${signal} signal received.`);
    return new Promise(resolve => {
      logger.warn(`5)\tHealth metric interval ending.`);
      clearInterval(metricSubscriptionInterval);
      return resolve();
    })
      .then(() => {
        logger.warn(`4)\tHTTP & WebSocket servers on port ${port} closing.`);
        subscriptionServer.close();
        return server.close();
      })
      .then(() => {
        logger.warn(`3)\tPostgres client ending.`);
        return pgClient.end();
      })
      .then(() => {
        logger.warn(`2)\tDatabase connection closing.`);
        return conn.close();
      })
      .then(() => {
        logger.warn(`1)\tShutting down. Goodbye!`);
        return done;
      })
      .catch(
        /* istanbul ignore next: don't care about nongraceful test shutdown */
        err => {
          logger.error("!)\tTERMERR", err);
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

/**
 * Start a cluster of servers, depending on machine CPU count.
 */
const clusterStart = () => {
  if (cluster.isMaster) {
    logger.info(`Using Node Cluster Mode!`);
    logger.info(`Master ${process.pid} is running!`);
    const numCPUs = cpus().length;
    logger.info(
      `Master is spawning ${numCPUs} worker${numCPUs > 1 ? "s" : ""}.`
    );
    for (let i = 1; i <= numCPUs; i++) {
      setTimeout(cluster.fork, i * 100);
    }
    // If the master is still alive but a worker dies, create a new worker.
    cluster.on("exit", (worker, code, signal) => {
      const deadWorkerPID = worker.process.pid;
      const nWorker = cluster.fork();
      const newWorkerPID = nWorker.process.pid;
      logger.warn(
        `Worker ${worker.id}:${deadWorkerPID} died, ` +
          `reborn as ${nWorker.id}:${newWorkerPID}!`
      );
    });
  } else {
    start(PORT);
    logger.info(`Worker ${cluster.worker.id}:${process.pid} is running!`);
  }
};

/* istanbul ignore next: test coverage never runs `node index` */
if (require.main === module) {
  if (USE_NODE_CLUSTER) {
    clusterStart();
  } else {
    start(PORT);
  }
}

export { pubSub, dateReviver };
export default start;
