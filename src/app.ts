import { ApolloServer } from "apollo-server-express";
import bodyParser from "body-parser";
import cors, { CorsOptions } from "cors";
import express from "express";
import { formatError } from "graphql";
import path from "path";
import serveIndex from "serve-index";
import { APP_VERSION, CORS_ORIGIN } from "./constants";
import gqlSchema from "./gqlSchema/schema";
import Auth from "./modules/Auth";
import { middlewareLogger } from "./util/logger";
import metric from "./util/metric";

const app: express.Express = express();

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

const graphqlBuildOptions = {
  context: ({ req }: { req: express.Request }) => ({
    jwtPayload: req && req.user,
    originIp: req && req.ip,
    originIps: req && req.ips,
    pubSub: app.get("pubSub")
  }),
  formatError: (error: any) => {
    return {
      ...formatError(error),
      state: error.originalError && error.originalError.state
    };
  },
  schema: gqlSchema,
  debug: false
};
const server = new ApolloServer(graphqlBuildOptions);

const CORS_OPTIONS: CorsOptions = {
  origin: CORS_ORIGIN,
  allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
  methods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
};
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.use(cors(CORS_OPTIONS));
app.use(middlewareLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(Auth.jwtMiddleware());

app.get("/health", (req: express.Request, res: express.Response) =>
  res.json(metric())
);
// TODO: GraphQL Server Side rendering with Hydrating client would be lit
app.get("/", (req: express.Request, res: express.Response) => {
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
      .center{display:flex;flex-direction:column;justify-content:center;height:100%;align-items:center;text-align:center;}
      .emph{text-decoration:underline;font-weight:bold;}
      #api-tbl tr:hover{background-color:rgb(22,22,22);}
      #api-tbl tr{height:1em;}
      #i-do{text-decoration:none;}
    </style>
  </head>
  <body>
    <div class="center">
      <img src="/static/logo/logo-inverse-64x64.png" alt="UDIA"/>
      <p>
        YO<span class="emph">U</span>
        <span class="emph">D</span>ISTURB
        <span class="emph">I</span>NTERNAL
        <span class="emph">A</span>PI
      </p>
      <p>VERSION ${APP_VERSION}<br/>
      <hr/>
      <table id="api-tbl">
      <tr>
        <td><a href="/static">/static</a></td>
        <td>static files</td></tr>
      <tr>
        <td><a href="https://github.com/udia-software/udia">server src</a></td>
        <td>server source</td>
      </tr>
      <tr>
        <td><a href="https://github.com/udia-software/udia-client">client src</a></td>
        <td>client source</td>
      </tr>
      </table>
      <br/>
      <a id="i-do" href="https://udia.ca">AIDU</a>
      </p>
    </div>
  </body>
  </html>`);
  res.end();
});
server.applyMiddleware({ app });

export default app;
