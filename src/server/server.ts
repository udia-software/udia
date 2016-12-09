/**
 * Created by alexander on 2016-12-08.
 */
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as compression from "compression";
import * as helmet from "helmet";
import * as logger from "morgan";
import * as path from "path";
import * as zlib from "zlib";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import mongoose = require("mongoose");

import {ThingRoutes} from "./api/thing/thing.routes";

/**
 * Representation of the server.
 *
 * @class Server
 */
export class Server {
  public app: express.Application;
  private connection: mongoose.Connection;

  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Create a new instance of the server.
   */
  constructor() {
    this.app = express();
    this.appConfig();
    this.dbConfig();
    this.api();
  }

  /**
   * Configure the express server middleware.
   */
  private appConfig() {
    // Add static client paths
    this.app.use(express.static(path.join(__dirname, "..", "client")));

    // Use JSON form and query string parser middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));

    this.app.use(cookieParser(process.env.APP_SECRET || "SECRET_GOES_HERE"));
    this.app.use(methodOverride());

    // Catch 404 and forward to the error handler
    this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      err.status = 404;
      next(err);
    });
    this.app.use(errorHandler());

    // Use compression for better performance
    this.app.use(compression({
      level: zlib.Z_BEST_COMPRESSION,
      threshold: "1kb"
    }));

    // Use helmet for better security for web applications
    this.app.use(helmet());
    this.app.use(logger("dev"));
  }

  /**
   * Configure the mongo database connection.
   */
  private dbConfig() {
    const MONGODB_URL: string = "mongodb://localhost:27017/udia";
    mongoose.Promise = require("bluebird");
    this.connection = mongoose.createConnection(process.env.MONGODB_URL || MONGODB_URL);
    console.log(this.connection);
  }

  /**
   * Setup the express router to handle serving the API
   */
  private api() {
    let router: express.Router = express.Router();
    ThingRoutes.init(router);
    this.app.use(router);
  }
}