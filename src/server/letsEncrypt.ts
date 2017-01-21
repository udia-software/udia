/**
 * Created by udia on 2017-01-20.
 */
import * as express from "express";

export class LetsEncrypt {
  private LETS_ENCRYPT_CHALLENGE_RESPONSE: string = process.env.LETS_ENCRYPT_CHALLENGE_RESPONSE || "";

  static init(router: express.Router) {
    router
      .route("/.well-known/acme-challenge/:content")
      .get(function (req: express.Request, res: express.Response, next: express.NextFunction): void {
        res.send(this.LETS_ENCRYPT_CHALLENGE_RESPONSE);
      });
  }
}