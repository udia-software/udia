"use strict";
/**
 * Created by alexander on 2016-12-08.
 */
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const jwt = require("express-jwt");
const logger = require("morgan");
const path = require("path");
const zlib = require("zlib");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const auth_passport_1 = require("./auth/auth.passport");
const auth_routes_1 = require("./auth/auth.routes");
const user_routes_1 = require("./api/user/user.routes");
const thing_routes_1 = require("./api/thing/thing.routes");
/**
 * Representation of the server.
 * This class simply creates the express application when instantiated.
 * To serve the application, please refer to `bin/www`.
 *
 * @class Server
 */
class Server {
    /**
     * Create a new instance of the server, which is the express app and all the configurations.
     */
    constructor() {
        this.MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/udia";
        this.APP_SECRET = process.env.APP_SECRET || "SECRET_GOES_HERE";
        this.SESSION_SECRET = process.env.SESSION_SECRET || "SECRET_GOES_HERE";
        this.app = express();
        this.appConfig();
        this.dbConfig();
        this.api();
    }
    static bootstrap() {
        return new Server();
    }
    /**
     * Configure the express server middleware.
     */
    appConfig() {
        // Add static client paths
        this.app.use(express.static(path.join(__dirname, "..", "client")));
        // Use JSON form and query string parser, cookie parser, and method override middleware
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cookieParser(this.APP_SECRET));
        this.app.use(methodOverride());
        // Catch 404 and forward to the error handler
        this.app.use(function (err, req, res, next) {
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
        // Express JWT takes the token and sets it to req.auth
        this.app.use(jwt({
            secret: this.SESSION_SECRET,
            credentialsRequired: false,
            requestProperty: "auth",
            getToken: function fromHeaderOrQueryString(req) {
                if (req.headers["authorization"] && req.headers["authorization"].split(" ")[0] === "Bearer") {
                    return req.headers["authorization"].split(" ")[1];
                }
                else if (req.query && req.query.token) {
                    return req.query.token;
                }
                return null;
            }
        }));
        // Log all API calls for development
        if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "") {
            this.app.use(logger("dev"));
        }
    }
    /**
     * Configure the MongoDB connection.
     */
    dbConfig() {
        mongoose.Promise = require("bluebird");
        if (process.env.NODE_ENV === "test") {
            mongoose.connect(this.MONGODB_URL + "_test");
        }
        else {
            mongoose.connect(this.MONGODB_URL);
        }
        mongoose.connection.on("error", console.error.bind(console, "An error occurred with the DB connection!"));
    }
    /**
     * Setup the router endpoints to handle serving the REST API
     */
    api() {
        let router = express.Router();
        auth_passport_1.AuthPassport.setup();
        auth_routes_1.AuthRoutes.init(router);
        user_routes_1.UserRoutes.init(router);
        thing_routes_1.ThingRoutes.init(router);
        router.route("/*")
            .get(function (req, res, next) {
            res.sendFile(path.join(__dirname, "..", "client", "index.html"));
        });
        this.app.use(router);
    }
}
exports.Server = Server;
