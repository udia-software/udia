/**
 * Created by udia on 2017-01-20.
 */
import * as express from "express";

export class LetsEncrypt {
  static init(router: express.Router) {
    let letsEncryptChallengeResponse: string = process.env.LETS_ENCRYPT_CHALLENGE_RESPONSE || "";
    router
      .route("/.well-known/acme-challenge/:content")
      .get(function (req: express.Request, res: express.Response, next: express.NextFunction): void {
        res.send(letsEncryptChallengeResponse);
      });
  }
}