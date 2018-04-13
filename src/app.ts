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
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.use(cors({ origin: CORS_ORIGIN.split(" ") }));
app.use(middlewareLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(Auth.jwtMiddleware());
app.use("/graphql", graphqlExpress(graphqlBuildOptions));
app.get("/health", (req, res) => res.json(metric()));
// TODO: GraphQL Server Side rendering with Hydrating client would be lit
app.get("/", (req, res) => res.send("UDIA API Server"));

export default app;
