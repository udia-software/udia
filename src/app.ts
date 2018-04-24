import {
  ExpressGraphQLOptionsFunction,
  graphqlExpress
} from "apollo-server-express";
import bodyParser from "body-parser";
import cors, { CorsOptions } from "cors";
import express from "express";
import { formatError } from "graphql";
import { APP_VERSION, CORS_ORIGIN } from "./constants";
import gqlSchema from "./gqlSchema";
import { IContext } from "./gqlSchema/resolvers";
import Auth from "./modules/Auth";
import { middlewareLogger } from "./util/logger";
import metric from "./util/metric";

const app = express();

const graphqlBuildOptions: ExpressGraphQLOptionsFunction = req => {
  let context: IContext = { jwtPayload: {}, originIp: "", originIps: [] };
  if (req) {
    context = {
      jwtPayload: req.user,
      originIp: req.ip,
      originIps: req.ips
    };
  }
  return {
    context,
    formatError: (error: any) => {
      return {
        ...formatError(error),
        state: error.originalError && error.originalError.state
      };
    },
    schema: gqlSchema,
    debug: false
  };
};
const CORS_OPTIONS: CorsOptions = {
  origin: CORS_ORIGIN,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
    "Authorization"
  ],
  methods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
};
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.use(cors(CORS_OPTIONS));
app.use(middlewareLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(Auth.jwtMiddleware());
app.use("/graphql", graphqlExpress(graphqlBuildOptions));
app.get("/health", (req, res) => res.json(metric()));
// TODO: GraphQL Server Side rendering with Hydrating client would be lit
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Raleway:400" />
    <title>UDIA API SERVER</title>
    <style>
      html{background-color:#000000;color:#ffffff;width:100%;height:100%;}
      body{width:100%;height:100%;margin:0px;font-family:"Raleway",consolas,courier;}
      .center{display:flex;flex-direction:column;justify-content:center;height:100%;text-align:center;}
    </style>
  </head>
  <body>
    <div class="center">
      <p>
      VERSION ${APP_VERSION}<br/>
      YOU DISTURB INTERNAL API<br/>
      ?<br/>
      AIDU
      </p>
    </div>
  </body>
  </html>`);
  res.end();
});

export default app;
