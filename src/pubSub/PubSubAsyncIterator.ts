import { PubSubEngine } from "graphql-subscriptions";
import { $$asyncIterator } from "iterall";

export class PubSubAsyncIterator<T> implements AsyncIterator<any> {
  private pullQueue: Array<(data: any) => void>;
  private pushQueue: any[];
  private eventsArray: string[];
  private allSubscribed: Promise<number[]>;
  private listening: boolean;
  private pubsub: PubSubEngine;

  constructor(pubsub: PubSubEngine, eventNames: string | string[]) {
    this.pubsub = pubsub;
    this.pullQueue = [];
    this.pushQueue = [];
    this.listening = true;
    this.eventsArray =
      typeof eventNames === "string" ? [eventNames] : eventNames;
    this.allSubscribed = this.subscribeAll();
  }

  public async next() {
    await this.allSubscribed;
    return this.listening ? this.pullValue() : this.return();
  }

  public async return() {
    this.emptyQueue(await this.allSubscribed);
    return Promise.resolve({ value: undefined, done: true });
  }

  public async throw(error: Error) {
    this.emptyQueue(await this.allSubscribed);
    return Promise.reject(error);
  }

  public [$$asyncIterator]() {
    return this;
  }

  private async pushValue(event: any) {
    await this.allSubscribed;
    if (this.pullQueue.length > 0) {
      const shift = this.pullQueue.shift();
      if (shift) {
        shift({ value: event, done: false });
      }
    } else {
      this.pushQueue.push(event);
    }
  }

  private pullValue(): Promise<IteratorResult<any>> {
    return new Promise(resolve => {
      if (this.pushQueue.length !== 0) {
        resolve({ value: this.pushQueue.shift(), done: false });
      } else {
        this.pullQueue.push(resolve);
      }
    });
  }

  private emptyQueue(subscriptionIds: number[]) {
    if (this.listening) {
      this.listening = false;
      this.unsubscribeAll(subscriptionIds);
      this.pullQueue.forEach(resolve =>
        resolve({ value: undefined, done: true })
      );
      this.pullQueue.length = 0;
      this.pushQueue.length = 0;
    }
  }

  private subscribeAll() {
    return Promise.all(
      this.eventsArray.map(eventName =>
        this.pubsub.subscribe(eventName, this.pushValue.bind(this), {})
      )
    );
  }

  private unsubscribeAll(subscriptionIds: number[]) {
    for (const subscriptionId of subscriptionIds) {
      this.pubsub.unsubscribe(subscriptionId);
    }
  }
}
