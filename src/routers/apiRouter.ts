import { Router } from "express";
import {
  deleteAuth,
  getAuthParams,
  getMe,
  patchAuth,
  postAuth,
  postAuthSignIn
} from "../controllers/auth";

const apiRouter = Router();

apiRouter
  .post("/auth", postAuth)
  .patch("/auth", patchAuth)
  .delete("/auth", deleteAuth)
  .post("/auth/sign_in", postAuthSignIn)
  .get("/auth/params", getAuthParams)
  .get("/me", getMe);

export default apiRouter;
