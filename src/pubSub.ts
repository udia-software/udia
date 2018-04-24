import { RedisPubSub } from "graphql-redis-subscriptions";
import { parse } from "url";
import { REDIS_URL } from "./constants";

const parts = parse(REDIS_URL);
const pubSub = new RedisPubSub({
  connection: {
    port: parseInt(parts.port || "6379", 10),
    host: parts.hostname || "localhost",
    password: parts.auth ? parts.auth.substr(parts.auth.indexOf(':') + 1) :undefined,
    db: parseInt(parts.path ? parts.path.substr(1): "0", 10)
  },
  reviver: (key, value) => {
    const isISO8601Z = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
    if (typeof value === "string" && isISO8601Z.test(value)) {
      const tempDateNumber = Date.parse(value);
      if (!isNaN(tempDateNumber)) {
        return new Date(tempDateNumber);
      }
    }
    return value;
  }
});

export default pubSub;
