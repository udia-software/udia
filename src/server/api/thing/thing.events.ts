/**
 * Created by udia on 2017-01-28.
 */
import {EventEmitter} from "events";
import Thing from "./thing.dao";
import {MongooseDocument} from "mongoose";
let ThingEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ThingEvents.setMaxListeners(0);

// Model events
let events = {
  save: "save",
  remove: "remove"
};

// Register the event emitter to the model events
for (let e in events) {
  let event = events[e];
  Thing.schema.post(e, emitEvent(event));
}

function emitEvent(event: string) {
  return function (doc: MongooseDocument) {
    ThingEvents.emit(`${event}:${doc._id}`, doc);
    ThingEvents.emit(event, doc);
  };
}

export default ThingEvents;
