"use strict";

import { config as AWSConfig, SES } from "aws-sdk";
import { duration } from "moment";
import { createTransport } from "nodemailer";
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_SES_REGION,
  CLIENT_DOMAINNAME,
  CLIENT_PROTOCOL,
  EMAIL_TOKEN_TIMEOUT,
  FROM_EMAIL,
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

/* istanbul ignore next: don't care about non test route */
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

/* istanbul ignore next: test coverage does not use AWS */
if (NODE_ENV !== "test" && !!AWS_ACCESS_KEY_ID && !!AWS_SECRET_ACCESS_KEY) {
  logger.info("Using AWS SDK for Mailer");
  AWSConfig.accessKeyId = AWS_ACCESS_KEY_ID;
  AWSConfig.secretAccessKey = AWS_SECRET_ACCESS_KEY;
  AWSConfig.region = AWS_SES_REGION;
  config = {
    SES: new SES({ apiVersion: "2010-12-01" }),
    sendingRate: 10 // max 10 messages per second
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
        address: FROM_EMAIL
      },
      to: {
        name: username,
        address: email
      },
      subject: `[UDIA${
        NODE_ENV !== "production"
          ? ` ${NODE_ENV}` /* istanbul ignore next: always test */
          : ""
      }] Validate Your Email`,
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
        /* istanbul ignore next: test mail never fails */
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
    const urlNoToken = `${CLIENT_PROTOCOL}://${CLIENT_DOMAINNAME}/reset-password`;
    const urlWithToken = `${urlNoToken}/${validationToken}`;
    const payload = {
      from: {
        name: "UDIA",
        address: FROM_EMAIL
      },
      to: {
        name: username,
        address: email
      },
      subject: `[UDIA${
        NODE_ENV !== "production"
        ? ` ${NODE_ENV}` /* istanbul ignore next: always test */
        : ""
      }] Reset Your Password`,
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
        `<p>to:<br/>` +
        `<a href="${urlNoToken}">${urlNoToken}</a></p>`
    };
    return transport
      .sendMail(payload)
      .then(info => {
        logger.info("sendForgotPasswordEmail sent", info);
      })
      .catch(
        /* istanbul ignore next: test mail never fails */
        err => {
          logger.error("sendForgotPasswordEmail failed", err);
        }
      );
  }
}
