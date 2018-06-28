import cluster from "cluster";
import { NextFunction, Request, Response } from "express";
import moment, { ISO_8601 } from "moment";
import onFinished from "on-finished";
import path from "path";
import { Logger as ITypeORMLogger } from "typeorm";
import { createLogger, format, Logger, transports } from "winston";
import { LOG_DIR, NODE_ENV, USE_NODE_CLUSTER } from "../constants";

const logLevel =
  NODE_ENV === "production"
    ? /* istanbul ignore next: will always be debug in test */ "info"
    : "debug";
const logFileSize = 10 * 1024 * 1024; // 10MiB
const logMaxFiles = 8;

// Default formatter, simply set timestamp to be now
const defaultFormatter = (logEntry: any) => {
  const json = {
    timestamp: new Date().toISOString(),
    pid: process.pid,
    ...logEntry
  };
  if (USE_NODE_CLUSTER) {
    json.workerNum = cluster.isMaster
      ? "MASTER"
      : cluster.worker.id;
  }
  logEntry[Symbol.for("message")] = JSON.stringify(json);
  return logEntry;
};

// Custom Formatter for console transport
/* istanbul ignore next: we don't want to see console output in test */
const consoleFormatter = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(({ timestamp, level, message, ...args }) => {
    return `${moment(timestamp, ISO_8601, true).toLocaleString()} ${
      USE_NODE_CLUSTER
        ? `[CLUSTER ${
            cluster.isMaster ? "MASTER" : cluster.worker.id
          }:${process.pid}] `
        : ""
    }[${level}]: ${message} ${
      Object.keys(args).length ? JSON.stringify(args) : ""
    }`;
  })
);

// Winston transports
const consoleTransport = new transports.Console({
  format: consoleFormatter
});
const fileTransport = new transports.File({
  filename: path.join(LOG_DIR, `${NODE_ENV}-${logLevel}.log`),
  level: logLevel,
  maxsize: logFileSize,
  maxFiles: logMaxFiles,
  tailable: true
});

// Winston logger instance. Transports change based on node environment.
const logger: Logger = createLogger({
  level: logLevel,
  format: format(defaultFormatter)(),
  transports: [consoleTransport, fileTransport],
  exitOnError: false
});

/* istanbul ignore next: we don't want to see console output in test */
if (NODE_ENV === "test") {
  logger.remove(consoleTransport);
}

const MS_PER_S = 1e3;
const NS_PER_MS = 1e6;
const middlewareLogger = (req: Request, res: Response, next: NextFunction) => {
  const reqStartAt = process.hrtime();
  const reqStartTime = new Date();
  const reqURL = req.originalUrl;
  onFinished(res, () => {
    const hrRespTime = process.hrtime(reqStartAt);
    const responseTime = hrRespTime[0] * MS_PER_S + hrRespTime[1] / NS_PER_MS;
    logger.info(`${res.statusCode} ${reqURL} ${responseTime}ms`, {
      requestStartTime: reqStartTime.toISOString(),
      reqIp: req.ip,
      reqIps: req.ips,
      statusCode: res.statusCode,
      reqUrl: reqURL,
      responseTime: hrRespTime
    });
  });

  next();
};

/* istanbul ignore next: don't cover TypeORM logger methods */
class TypeORMLogger implements ITypeORMLogger {
  /**
   * Winston logger instance. Transports change based on node environment.
   */
  private static winstonTypeORMlogger = createLogger({
    level: "verbose",
    transports: [
      new transports.File({
        filename: path.join(LOG_DIR, `${NODE_ENV}-typeorm.log`),
        level: "verbose",
        maxsize: logFileSize,
        maxFiles: logMaxFiles,
        tailable: true
      })
    ],
    exitOnError: false
  });

  public logQuery(query: string, parameters?: any[] | undefined) {
    TypeORMLogger.winstonTypeORMlogger.verbose(`[TypeORM] Query`, {
      query,
      parameters
    });
  }
  public logQueryError(
    error: string,
    query: string,
    parameters?: any[] | undefined
  ) {
    TypeORMLogger.winstonTypeORMlogger.warn(`[TypeORM] Query Error`, {
      error,
      query,
      parameters
    });
  }
  public logQuerySlow(
    time: number,
    query: string,
    parameters?: any[] | undefined
  ) {
    TypeORMLogger.winstonTypeORMlogger.warn(`[TypeORM] Query Slow ${time}`, {
      query,
      parameters
    });
  }
  public logSchemaBuild(message: string) {
    TypeORMLogger.winstonTypeORMlogger.verbose(`[TypeORM] Schema Build`, {
      message
    });
  }
  public logMigration(message: string) {
    TypeORMLogger.winstonTypeORMlogger.verbose(`[TypeORM] Migration`, {
      message
    });
  }
  public log(level: "log" | "info" | "warn", message: any) {
    TypeORMLogger.winstonTypeORMlogger.verbose(`[TypeORM] ${level}`, {
      message
    });
  }
}

export default logger;
export { middlewareLogger, TypeORMLogger };
