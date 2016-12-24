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

import {UserRoutes} from "./api/user/user.routes";
import {ThingRoutes} from "./api/thing/thing.routes";

/**
 * Representation of the server.
 * This class simply creates the express application when instantiated.
 * To serve the application, please refer to `bin/www`.
 *
 * @class Server
 */
export class Server {
  private MONGODB_URL: string = process.env.MONGODB_URL || "mongodb://localhost:27017/udia";
  private APP_SECRET: string = process.env.APP_SECRET || "SECRET_GOES_HERE";

  public app: express.Application;

  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Create a new instance of the server, which is the express app and all the configurations.
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
  private appConfig(): void {
    // Add static client paths
    this.app.use(express.static(path.join(__dirname, "..", "client")));

    // Use JSON form and query string parser, cookie parser, and method override middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(cookieParser(this.APP_SECRET));
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
    // Log all API calls
    this.app.use(logger("dev"));
  }

  /**
   * Configure the MongoDB connection.
   */
  private dbConfig(): void {
    mongoose.Promise = require("bluebird");
    mongoose.connect(this.MONGODB_URL);
    mongoose.connection.on("error", console.error.bind(console, "An error occurred with the DB connection!"));
  }

  /**
   * Setup the router endpoints to handle serving the REST API
   */
  private api(): void {
    let router: express.Router = express.Router();
    UserRoutes.init(router);
    ThingRoutes.init(router);
    this.app.use(router);
  }
}