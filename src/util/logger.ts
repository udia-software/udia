import { NextFunction, Request, Response } from "express";
import moment from "moment";
import onFinished from "on-finished";
import { Logger, transports } from "winston";
import { NODE_ENV } from "../constants";

/* istanbul ignore next */
const logLevel = NODE_ENV === "production" ? "info" : "debug";
const logFileSize = 10 * 1024 * 1024; // 10MiB
const logMaxFiles = 8;

/**
 * Winston logger instance. Transports change based on node environment.
 */
const logger = new Logger({
  level: logLevel,
  transports: [
    new transports.Console({
      name: "console",
      colorize: true,
      timestamp: true
    }),
    new transports.File({
      name: `${NODE_ENV}-info`,
      filename: `log/${NODE_ENV}-info.log`,
      level: "info",
      maxsize: logFileSize,
      maxFiles: logMaxFiles,
      tailable: true
    }),
    new transports.File({
      name: `${NODE_ENV}-error`,
      filename: `log/${NODE_ENV}-error.log`,
      level: "error",
      maxsize: logFileSize,
      maxFiles: logMaxFiles,
      tailable: true
    })
  ],
  exitOnError: false
});

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

export default logger;
export { middlewareLogger };
