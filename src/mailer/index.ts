"use strict";

import { duration } from "moment";
import { createTransport } from "nodemailer";
import {
  CLIENT_DOMAINNAME,
  CLIENT_PROTOCOL,
  EMAIL_TOKEN_TIMEOUT,
  NODE_ENV,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME
} from "../constants";
import logger from "../util/logger";

let config: any = {
  pool: true,
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD
  }
};

// coverage don't care about non test route
/* istanbul ignore next */
if (NODE_ENV === "development") {
  config = {
    streamTransport: true,
    newline: "unix",
    buffer: true
  };
} else if (NODE_ENV === "test") {
  config = {
    streamTransport: true,
    newline: "unix"
  };
}

const transport = createTransport(config);

export default class Mailer {
  public static sendEmailVerification(
    username: string,
    email: string,
    validationToken: string
  ): Promise<any> {
    const validityTime = duration(
      +EMAIL_TOKEN_TIMEOUT,
      "milliseconds"
    ).humanize();
    const urlNoToken = `${CLIENT_PROTOCOL}://${CLIENT_DOMAINNAME}/verify-email`;
    const urlWithToken = `${urlNoToken}/${validationToken}`;
    const payload = {
      from: {
        name: "UDIA",
        address: "do-not-reply@udia.ca"
      },
      to: {
        name: username,
        address: email
      },
      subject: "[UDIA] Validate Your Email",
      text:
        "This is your email validation token.\n" +
        `It is valid for ${validityTime}.\n` +
        "You may verify your email by going to the following link:\n" +
        `${urlWithToken}\n` +
        "or by manually copying and pasting your token:\n" +
        `${validationToken}\n` +
        "at\n" +
        `${urlNoToken}\n`,
      html:
        "<p>This is your email validation token.<br/>" +
        `It is valid for ${validityTime}.</p>` +
        "<p>You may verify your email by clicking:<br/>" +
        `<a href="${urlWithToken}">${urlWithToken}</a>` +
        "</p>" +
        "<p>You may also verify your email by manually copying and pasting your token:</p>" +
        `<pre><code><a href="#" style="text-decoration:none;">${validationToken}</a></code></pre>` +
        "<p>to:<br/>" +
        `<a href="${urlNoToken}">${urlNoToken}</a></p>`
    };
    return transport
      .sendMail(payload)
      .then(info => {
        logger.info("sendEmailVerification sent", info);
      })
      .catch(
        // coverage don't care about send mail failure, test mail never fails
        /* istanbul ignore next */
        err => {
          logger.error("sendEmailVerification failed", err);
        }
      );
  }

  public static sendForgotPasswordEmail(
    username: string,
    email: string,
    validationToken: string
  ): Promise<any> {
    const validityTime = duration(
      +EMAIL_TOKEN_TIMEOUT,
      "milliseconds"
    ).humanize();
    const urlNoToken = `${CLIENT_PROTOCOL}://${CLIENT_DOMAINNAME}/password-reset`;
    const urlWithToken = `${urlNoToken}/${validationToken}`;
    const payload = {
      from: {
        name: "UDIA",
        address: "do-not-reply@udia.ca"
      },
      to: {
        name: username,
        address: email
      },
      subject: "[UDIA] Reset Your Password",
      text:
        `This is your password reset token.\n` +
        `It is valid for ${validityTime}.\n` +
        `You may verify your email by going to the following link:\n` +
        `${urlWithToken}\n` +
        `or by manually copying and pasting your token:\n` +
        `${validationToken}\n` +
        `at\n` +
        `${urlNoToken}\n`,
      html:
        `<p>This is your password reset token.<br/>` +
        `It is valid for ${validityTime}.</p>` +
        `<p>You may verify your email by clicking:<br/>` +
        `<a href="${urlWithToken}">${urlWithToken}</a>` +
        `</p>` +
        `<p>You may also verify your email by manually copying and pasting your token:</p>` +
        `<pre><code><a href="#" style="text-decoration:none;">${validationToken}</a></code></pre>` +
        `<p>to:` +
        `<br/><a href="${urlNoToken}">${urlNoToken}</a></p>`
    };
    return transport
      .sendMail(payload)
      .then(info => {
        logger.info("sendForgotPasswordEmail sent", info);
      })
      .catch(
        // coverage don't care about send mail failure, test mail never fails
        /* istanbul ignore next */
        err => {
          logger.error("sendForgotPasswordEmail failed", err);
        }
      );
  }
}
