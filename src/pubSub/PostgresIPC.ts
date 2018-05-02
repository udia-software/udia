import { EventEmitter } from "events";
import { Client } from "pg";

const RESERVED_CHANNELS = [
  "newListener",
  "removeListener",
  "notify",
  "unlisten",
  "listen",
  "error",
  "end"
];

export default class PostgresIPC extends EventEmitter {
  private pgClient: Client;
  private ending: boolean = false;

  constructor(client: Client, reviver?: any) {
    super();
    this.pgClient = client;

    this.on("newListener", (channel: string, fn) => {
      if (
        RESERVED_CHANNELS.indexOf(channel) < 0 &&
        this.listenerCount(channel) === 0
      ) {
        this._dispatchListen(channel);
      }
    });

    this.on("removeListener", (channel: string, fn) => {
      if (
        RESERVED_CHANNELS.indexOf(channel) < 0 &&
        this.listenerCount(channel) === 0
      ) {
        this._dispatchUnlisten(channel);
      }
    });

    this.pgClient.on("notification", msg => {
      try {
        msg.payload = msg.payload
          ? JSON.parse(msg.payload, reviver)
          : msg.payload;
      } catch (err) {
        // JSON may not always parse. This is OK.
      } finally {
        this.emit(msg.channel, msg.payload);
      }
    });
  }

  /**
   * Send a notification through Postgres Client IPC
   * @param channel Notification channel name identifier
   * @param payload some arbitrary object, should be <8000 bytes in size
   */
  public notify(channel: string, payload: any) {
    const encodedPayload =
      typeof payload !== `string` ? JSON.stringify(payload) : payload;
    const statement =
      `NOTIFY ${this.pgClient.escapeIdentifier(channel)}, ` +
      `${this._quoteLiteral(encodedPayload)}`;
    this.pgClient.query(statement, (err, res) => {
      if (err) {
        this.emit("error", err);
      } else {
        this.emit("notify", channel, payload);
      }
    });
  }

  /**
   * End the notification IPC listeners
   */
  public end() {
    if (this.ending) {
      return;
    }
    this.ending = true;
    this.pgClient.query(`UNLISTEN *`, this._endCallback);
  }

  /**
   * Given an ISO8601 date string, convert it to postgres compliant string
   * @param date
   */
  protected _formatDate(date: string) {
    date = date.replace("T", " ");
    date = date.replace("Z", "+00");
    return date;
  }

  /**
   * Given an array of strings, return a single postgres compliant string
   * @param array array of strings to format
   * @param useSpace should the element begin with a space?
   * @param formatter formatter function to use
   */
  protected _arrayToList(
    array: [string],
    formatter: (_: string) => string,
    useSpace: boolean
  ) {
    let sql = "";
    sql += useSpace ? " (" : "(";
    for (let i = 0; i < array.length; i++) {
      sql += (i === 0 ? "" : ", ") + formatter(array[i]);
    }
    sql += ")";
    return sql;
  }

  /**
   * Helper method for encoding raw objects. (currently only using strings)
   * @param value any value
   */
  protected _quoteLiteral(value: any): string {
    switch (true) {
      case value === undefined || value === null:
        return "NULL";
      case value === false:
        return "'f'";
      case value === true:
        return "'t'";
      case value instanceof Date:
        return "'" + this._formatDate(value.toISOString()) + "'";
      case value instanceof Buffer:
        return "E'\\\\x" + value.toString("hex") + "'";
      case Array.isArray(value) === true:
        const temp = [];
        for (let i = 0; i < value.length; i++) {
          if (Array.isArray(value[i]) === true) {
            temp.push(this._arrayToList(value[i], this._quoteLiteral, i !== 0));
          } else {
            temp.push(this._quoteLiteral(value[i]));
          }
        }
        return temp.toString();
      case value === Object(value):
        return this.pgClient.escapeLiteral(JSON.stringify(value)) + "::jsonb";
      default:
        const copy = JSON.parse(JSON.stringify(value)); // brute copy
        return this.pgClient.escapeLiteral(copy);
    }
  }

  private _dispatchListen(channel: string) {
    this.pgClient.query(
      `LISTEN ${this.pgClient.escapeIdentifier(channel)}`,
      err => {
        if (err) {
          this.emit("error", err);
        } else {
          this.emit("listen", channel);
        }
      }
    );
  }

  private _dispatchUnlisten(channel: string) {
    this.pgClient.query(
      `UNLISTEN ${this.pgClient.escapeIdentifier(channel)}`,
      err => {
        if (err) {
          this.emit("error", err);
        } else {
          this.emit("unlisten", channel);
        }
      }
    );
  }

  private _endCallback(err: any) {
    if (err) {
      this.ending = false;
      this.emit("error", err);
    } else {
      this.emit("end");
      this.removeAllListeners();
    }
  }
}
