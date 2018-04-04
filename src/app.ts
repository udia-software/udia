import {
  ExpressGraphQLOptionsFunction,
  graphqlExpress
} from "apollo-server-express";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { formatError } from "graphql";
import { CORS_ORIGIN } from "./constants";
import gqlSchema from "./gqlSchema";
import Auth from "./modules/Auth";
import apiRouter from "./routers/apiRouter";
import { middlewareLogger } from "./util/logger";
import metric from "./util/metric";

const app = express();

const graphqlBuildOptions: ExpressGraphQLOptionsFunction = req => {
  let context;
  if (req) {
    context = {
      user: (req || {}).user || null,
      originIp: req.ip || "",
      originIps: req.ips || []
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
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.use(cors({ origin: CORS_ORIGIN.split(" ") }));
app.use(middlewareLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(Auth.verifyUserJWTMiddleware());
app.use("/graphql", bodyParser.json(), graphqlExpress(graphqlBuildOptions));
app.get("/health", (req, res) => res.json(metric()));
app.use("/api", apiRouter);
// TODO: GraphQL Server Side rendering with Hydrating client would be lit
app.get("/", (req, res) => res.send("Hello world."));

export default app;
