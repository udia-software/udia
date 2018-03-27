import bodyParser from "body-parser";
import express from "express";
import * as authController from "./controllers/auth";
import Auth from "./modules/Auth";
import { middlewareLogger } from "./util/logger";
import metric from "./util/metric";

const app = express();

app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

app.use(middlewareLogger);
app.use(Auth.verifyUserJWTMiddleware());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res, next) => {
  res.json(metric());
});
app.post("/auth", authController.postAuth);
app.patch("/auth", authController.patchAuth);
app.post("/auth/sign_in", authController.postAuthSignIn);
app.get("/auth/params", authController.getAuthParams);

export default app;
