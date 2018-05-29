import {
  ExpressGraphQLOptionsFunction,
  graphiqlExpress,
  graphqlExpress
} from "apollo-server-express";
import bodyParser from "body-parser";
import cors, { CorsOptions } from "cors";
import express from "express";
import { formatError } from "graphql";
import path from "path";
import serveIndex from "serve-index";
import { APP_VERSION, CORS_ORIGIN, DEV_JWT, NODE_ENV, PORT } from "./constants";
import gqlSchema from "./gqlSchema";
import Auth from "./modules/Auth";
import { middlewareLogger } from "./util/logger";
import metric from "./util/metric";

const app = express();

// serve static files with index
app.use(
  "/static",
  express.static(path.join(__dirname, "..", "static")),
  serveIndex(path.join(__dirname, "..", "static"), {
    icons: true,
    view: "details"
  })
);
// serve favicons at the root level
app.use("/", express.static(path.join(__dirname, "..", "static", "favicons")));

const graphqlBuildOptions: ExpressGraphQLOptionsFunction = req => {
  return {
    context: {
      jwtPayload: req && req.user,
      originIp: req && req.ip,
      originIps: req && req.ips,
      pubSub: app.get("pubSub")
    },
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

// coverage don't care about vetting developer graphiql route
/* istanbul ignore next */
if (NODE_ENV !== "production") {
  const jwt = DEV_JWT;
  app.use(
    "/graphiql",
    graphiqlExpress({
      endpointURL: "/graphql",
      passHeader: jwt && `Authorization: Bearer ${jwt}`,
      subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
    })
  );
}
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
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
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
