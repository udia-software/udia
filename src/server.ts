import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import mongoose = require("mongoose");

// routes
import {IndexRoute} from "./routes/index";

// interfaces
import {IUser} from "./interfaces/user";

// models
import {IModel} from "./models/model";
import {IUserModel} from "./models/user";

// schemas
import {userSchema} from "./schemas/user";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    public app: express.Application;
    private model: IModel;

    /**
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     */
    public static bootstrap(): Server {
        return new Server();
    }

    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
        // instance defaults
        this.model = Object();

        //create expressjs application
        this.app = express();

        //configure application
        this.config();

        //add routes
        this.routes();

        //add api
        this.api();
    }

    /**
     * Create REST API routes
     *
     * @class Server
     * @method api
     */
    public api() {
        //empty for now
    }

    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    public config() {
        const MONGODB_CONNECTION: string = "mongodb://localhost:27017/udia";

        //add static paths
        this.app.use(express.static(path.join(__dirname, "public")));

        //configure pug
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");

        //use logger middlware
        this.app.use(logger("dev"));

        //use json form parser middlware
        this.app.use(bodyParser.json());

        //use query string parser middlware
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        //use cookie parker middleware middlware
        this.app.use(cookieParser("SECRET_GOES_HERE"));

        //use override middlware
        this.app.use(methodOverride());

        //use q promises
        global.Promise = require("q").Promise;
        mongoose.Promise = global.Promise;

        let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

        this.model.user = connection.model<IUserModel>("User", userSchema);

        //catch 404 and forward to error handler
        this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });

        //error handling
        this.app.use(errorHandler());
    }

    /**
     * Create router
     *
     * @class Server
     * @method api
     */
    public routes() {
        let router: express.Router;
        router = express.Router();

        IndexRoute.create(router);

        this.app.use(router);
    }
}