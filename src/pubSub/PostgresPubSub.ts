import { PubSubEngine } from "graphql-subscriptions";
import { Client } from "pg";
import PostgresIPC from "./PostgresIPC";
import { PubSubAsyncIterator } from "./PubSubAsyncIterator";

export default class PostgresPubSub implements PubSubEngine {
  protected ee: PostgresIPC;
  private subscriptions: any;
  private subIdCounter: any;

  constructor(pgClient: Client) {
    this.ee = new PostgresIPC(pgClient);
    this.subscriptions = {};
    this.subIdCounter = 0;
  }

  public publish(triggerName: string, payload: any) {
    this.ee.notify(triggerName, payload);
    return true;
  }

  public subscribe(triggerName: string, onMessage: (...args: any[]) => void) {
    const cb = (payload: any) => onMessage(payload);
    this.ee.on(triggerName, cb);
    this.subIdCounter += 1;
    this.subscriptions[this.subIdCounter] = [triggerName, cb];
    return Promise.resolve(this.subIdCounter);
  }

  public unsubscribe(subId: number) {
    const [triggerName, onMessage] = this.subscriptions[subId];
    delete this.subscriptions[subId];
    this.ee.removeListener(triggerName, onMessage);
  }

  public asyncIterator<T>(triggers: string | string[]): AsyncIterator<any> {
    return new PubSubAsyncIterator(this, triggers);
  }
}
