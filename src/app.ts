import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { CORS_ORIGIN } from "./constants";
import Auth from "./modules/Auth";
import apiRouter from "./routers/apiRouter";
import { middlewareLogger } from "./util/logger";
import metric from "./util/metric";

const app = express();

app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.use(cors({ origin: CORS_ORIGIN.split(" ") }));
app.use(middlewareLogger);
app.use(Auth.verifyUserJWTMiddleware());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/health", (req, res) => res.json(metric()));
app.use("/api", apiRouter);
app.get("/", (req, res) => res.send("Hello world."));

export default app;
