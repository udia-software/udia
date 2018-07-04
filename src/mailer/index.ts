"use strict";

import { config as AWSConfig, SES } from "aws-sdk";
import { readFileSync } from "fs";
import { duration, utc } from "moment";
import { createTransport } from "nodemailer";
import path from "path";
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_SES_REGION,
  CLIENT_DOMAINNAME,
  CLIENT_PROTOCOL,
  EMAIL_TEMPLATES_DIR,
  EMAIL_TOKEN_TIMEOUT,
  FROM_EMAIL,
  LEGAL_DIR,
  NODE_ENV,
  REPLY_TO_EMAIL_ADDR,
  REPLY_TO_EMAIL_NAME,
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
  logger.info(
    `Mailer: AWS-SES; region ${AWS_SES_REGION}; keyID: ${AWS_ACCESS_KEY_ID};`
  );
  AWSConfig.accessKeyId = AWS_ACCESS_KEY_ID;
  AWSConfig.secretAccessKey = AWS_SECRET_ACCESS_KEY;
  AWSConfig.region = AWS_SES_REGION;
  config = {
    SES: new SES({ apiVersion: "2010-12-01" }),
    sendingRate: 10 // max 10 messages per second
  };
} else {
  logger.info(
    `Mailer: SMTP; user: ${SMTP_USERNAME}; host: ${SMTP_HOST}; port: ${SMTP_PORT};`
  );
}

const transport = createTransport(config);

interface IEmailVerificationVariables {
  username: string;
  sendEmailTime: string;
  tokenValidDuration: string;
  urlWithToken: string;
}

export default class Mailer {
  public static sendEmailVerification(
    username: string,
    email: string,
    validationToken: string
  ): Promise<any> {
    const tokenValidDuration = duration(
      +EMAIL_TOKEN_TIMEOUT,
      "milliseconds"
    ).humanize();
    const urlNoToken = `${CLIENT_PROTOCOL}://${CLIENT_DOMAINNAME}/verify-email`;
    const urlWithToken = `${urlNoToken}/${validationToken}`;
    const sendEmailTime = utc().format("ddd, MMM D, YYYY @ h:mm A Z");
    const { html, text } = Mailer.createVerifyEmailContent({
      username,
      sendEmailTime,
      tokenValidDuration,
      urlWithToken
    });
    return transport
      .sendMail({
        from: {
          name: "UDIA",
          address: FROM_EMAIL
        },
        to: {
          name: username,
          address: email
        },
        replyTo: {
          name: REPLY_TO_EMAIL_NAME,
          address: REPLY_TO_EMAIL_ADDR
        },
        subject: `[UDIA${
          NODE_ENV !== "production"
            ? ` ${NODE_ENV}` /* istanbul ignore next: always test */
            : ''
        }] Validate Your Email`,
        text,
        html,
        attachments: [
          { path: path.join(LEGAL_DIR, "Terms of Service.txt") },
          { path: path.join(LEGAL_DIR, "Privacy Policy.txt") }
        ]
      })
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
    const tokenValidDuration = duration(
      +EMAIL_TOKEN_TIMEOUT,
      "milliseconds"
    ).humanize();
    const urlNoToken = `${CLIENT_PROTOCOL}://${CLIENT_DOMAINNAME}/reset-password`;
    const urlWithToken = `${urlNoToken}/${validationToken}`;
    const sendEmailTime = utc().format("ddd, MMM D, YYYY @ h:mm A Z");
    const { html, text } = Mailer.createResetPasswordContent({
      username,
      sendEmailTime,
      tokenValidDuration,
      urlWithToken
    });
    return transport
      .sendMail({
        from: {
          name: "UDIA",
          address: FROM_EMAIL
        },
        to: {
          name: username,
          address: email
        },
        replyTo: {
          name: REPLY_TO_EMAIL_NAME,
          address: REPLY_TO_EMAIL_ADDR
        },
        subject: `[UDIA${
          NODE_ENV !== "production"
            ? ` ${NODE_ENV}` /* istanbul ignore next: always test */
            : ''
        }] Reset Your Password`,
        text,
        html
      })
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

  private static verifyEmailHTMLTemplate = readFileSync(
    path.join(EMAIL_TEMPLATES_DIR, "verify_email_template.html"),
    { encoding: "utf8" }
  );

  private static verifyEmailTXTTemplate = readFileSync(
    path.join(EMAIL_TEMPLATES_DIR, "verify_email_template.txt"),
    { encoding: "utf8" }
  );

  private static resetPasswordHTMLTemplate = readFileSync(
    path.join(EMAIL_TEMPLATES_DIR, "reset_password_template.html"),
    { encoding: "utf8" }
  );

  private static resetPasswordTXTTemplate = readFileSync(
    path.join(EMAIL_TEMPLATES_DIR, "reset_password_template.txt"),
    { encoding: "utf8" }
  );

  private static createVerifyEmailContent({
    username,
    sendEmailTime,
    tokenValidDuration,
    urlWithToken
  }: IEmailVerificationVariables) {
    return {
      html: Mailer.verifyEmailHTMLTemplate
        .replace(new RegExp("@@USERNAME@@", "g"), username)
        .replace(new RegExp("@@SENT_EMAIL_TIME@@", "g"), sendEmailTime)
        .replace(
          new RegExp("@@TOKEN_VALID_DURATION@@", "g"),
          tokenValidDuration
        )
        .replace(new RegExp("@@URL_WITH_TOKEN@@", "g"), urlWithToken),
      text: Mailer.verifyEmailTXTTemplate
        .replace(new RegExp("@@USERNAME@@", "g"), username)
        .replace(new RegExp("@@SENT_EMAIL_TIME@@", "g"), sendEmailTime)
        .replace(
          new RegExp("@@TOKEN_VALID_DURATION@@", "g"),
          tokenValidDuration
        )
        .replace(new RegExp("@@URL_WITH_TOKEN@@", "g"), urlWithToken)
    };
  }

  private static createResetPasswordContent({
    username,
    sendEmailTime,
    tokenValidDuration,
    urlWithToken
  }: IEmailVerificationVariables) {
    return {
      html: Mailer.resetPasswordHTMLTemplate
        .replace(new RegExp("@@USERNAME@@", "g"), username)
        .replace(new RegExp("@@SENT_EMAIL_TIME@@", "g"), sendEmailTime)
        .replace(
          new RegExp("@@TOKEN_VALID_DURATION@@", "g"),
          tokenValidDuration
        )
        .replace(new RegExp("@@URL_WITH_TOKEN@@", "g"), urlWithToken),
      text: Mailer.resetPasswordTXTTemplate
        .replace(new RegExp("@@USERNAME@@", "g"), username)
        .replace(new RegExp("@@SENT_EMAIL_TIME@@", "g"), sendEmailTime)
        .replace(
          new RegExp("@@TOKEN_VALID_DURATION@@", "g"),
          tokenValidDuration
        )
        .replace(new RegExp("@@URL_WITH_TOKEN@@", "g"), urlWithToken)
    };
  }
}
