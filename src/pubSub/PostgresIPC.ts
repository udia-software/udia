import { EventEmitter } from "events";
import { Client } from "pg";

const RESERVED_CHANNELS = {
  newListener: true,
  removeListener: true,
  notify: true,
  unlisten: true,
  listen: true,
  error: true,
  end: true
};

export default class PostgresIPC extends EventEmitter {
  private pgClient: Client;
  private ending: boolean = false;

  constructor(client: Client) {
    super();
    this.pgClient = client;

    this.on("newListener", (channel: string, fn) => {
      if (channel in RESERVED_CHANNELS && this.listenerCount(channel) === 0) {
        this._dispatchListen(channel);
      }
    });

    this.on("removeListener", (channel: string, fn) => {
      if (channel in RESERVED_CHANNELS && this.listenerCount(channel) > 0) {
        this._dispatchUnlisten(channel);
      }
    });

    this.pgClient.on("notification", msg => {
      try {
        msg.payload = msg.payload ? JSON.parse(msg.payload) : msg.payload;
      } catch (err) {
        // JSON may not always parse. This is OK.
      } finally {
        this.emit(msg.channel, msg);
      }
    });
  }

  public notify(channel: string, payload: any) {
    const encodedPayload =
      typeof payload !== `string` ? JSON.stringify(payload) : payload;
    const statement =
      `NOTIFY ${this.pgClient.escapeIdentifier(channel)}, ` +
      `${this._quoteLiteral(encodedPayload)}`;
    this.pgClient.query(statement, err => {
      if (err) {
        this.emit("error", err);
      } else {
        this.emit("notify", channel, payload);
      }
    });
  }

  public end() {
    if (this.ending) {
      return;
    }
    this.ending = true;
    this.pgClient.query(`UNLISTEN *`, this._endCallback);
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

  private _formatDate(date: string) {
    date = date.replace("T", " ");
    date = date.replace("Z", "+00");
    return date;
  }

  private _arrayToList(
    useSpace: boolean,
    array: [string],
    formatter: (data: string) => string
  ) {
    let sql = "";

    sql += useSpace ? " (" : "(";
    for (let i = 0; i < array.length; i++) {
      sql += (i === 0 ? "" : ", ") + formatter(array[i]);
    }
    sql += ")";

    return sql;
  }

  private _quoteLiteral(value: any): string {
    let literal = null;
    let explicitCast = null;

    if (value === undefined || value === null) {
      return "NULL";
    } else if (value === false) {
      return "'f'";
    } else if (value === true) {
      return "'t'";
    } else if (value instanceof Date) {
      return "'" + this._formatDate(value.toISOString()) + "'";
    } else if (value instanceof Buffer) {
      return "E'\\\\x" + value.toString("hex") + "'";
    } else if (Array.isArray(value) === true) {
      const temp = [];
      for (let i = 0; i < value.length; i++) {
        if (Array.isArray(value[i]) === true) {
          temp.push(this._arrayToList(i !== 0, value[i], this._quoteLiteral));
        } else {
          temp.push(this._quoteLiteral(value[i]));
        }
      }
      return temp.toString();
    } else if (value === Object(value)) {
      explicitCast = "jsonb";
      literal = JSON.stringify(value);
    } else {
      literal = value.toString().slice(0); // create copy
    }

    let hasBackslash = false;
    let quoted = "'";

    for (const c of literal) {
      if (c === "'") {
        quoted += c + c;
      } else if (c === "\\") {
        quoted += c + c;
        hasBackslash = true;
      } else {
        quoted += c;
      }
    }

    quoted += "'";

    if (hasBackslash === true) {
      quoted = "E" + quoted;
    }

    if (explicitCast) {
      quoted += "::" + explicitCast;
    }

    return quoted;
  }
}
