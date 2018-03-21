import bodyParser from "body-parser";
import express from "express";
import * as authController from "./controllers/auth";
import metric from "./metric";

const app = express();

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
