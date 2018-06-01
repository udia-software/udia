import { NextFunction, Request, Response } from "express";
import moment from "moment";
import onFinished from "on-finished";
import { Logger as ITypeORMLogger } from "typeorm";
import { Logger, LoggerInstance, transports } from "winston";
import { NODE_ENV } from "../constants";

// this is always debug in test
/* istanbul ignore next */
const logLevel = NODE_ENV === "production" ? "info" : "debug";
const logFileSize = 10 * 1024 * 1024; // 10MiB
const logMaxFiles = 8;

/**
 * Winston logger instance. Transports change based on node environment.
 */
const logger: LoggerInstance = new Logger({
  level: logLevel,
  transports: [
    new transports.Console({
      name: "console",
      colorize: true,
      timestamp: true
    }),
    new transports.File({
      name: `${NODE_ENV}-${logLevel}`,
      filename: `log/${NODE_ENV}-${logLevel}.log`,
      level: logLevel,
      maxsize: logFileSize,
      maxFiles: logMaxFiles,
      tailable: true
    })
  ],
  exitOnError: false
});

// we don't want to see console output in test
/* istanbul ignore next */

if (NODE_ENV === "test") {
  logger.remove("console");
}

const MS_PER_S = 1e3;
const NS_PER_MS = 1e6;
const middlewareLogger = (req: Request, res: Response, next: NextFunction) => {
  const reqStartAt = process.hrtime();
  const reqStartTime = moment();
  const reqURL = req.originalUrl;
  onFinished(res, () => {
    const hrRespTime = process.hrtime(reqStartAt);
    const responseTime = hrRespTime[0] * MS_PER_S + hrRespTime[1] / NS_PER_MS;
    logger.info(`${res.statusCode} ${reqURL} ${responseTime}ms`, {
      requestStartTime: reqStartTime.toISOString(true),
      reqIp: req.ip,
      reqIps: req.ips,
      statusCode: res.statusCode,
      reqUrl: reqURL,
      responseTime: hrRespTime
    });
  });

  next();
};

// don't cover TypeORM logger methods
/* istanbul ignore next */
class TypeORMLogger implements ITypeORMLogger {
  /**
   * Winston logger instance. Transports change based on node environment.
   */
  private static winstonTypeORMlogger = new Logger({
    level: "verbose",
    transports: [
      new transports.File({
        name: `${NODE_ENV}-typeorm`,
        filename: `log/${NODE_ENV}-typeorm.log`,
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
