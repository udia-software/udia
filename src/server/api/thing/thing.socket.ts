/**
 * Created by udia on 2017-01-28.
 */
import ThingEvents from "./thing.events";
import {MongooseDocument} from "mongoose";
import Socket = SocketIO.Socket;

// Model events to emit
let events = ["save", "remove"];

export function register(socket: Socket) {
  // Bind model events to socket events
  for (let i = 0, eventsLength = events.length; i < eventsLength; i++) {
    let event = events[i];
    let listener = createListener(`thing:${event}`, socket);

    ThingEvents.on(event, listener);
    socket.on("disconnect", removeListener(event, listener));
  }
}


function createListener(event: string, socket: Socket) {
  return function (doc: MongooseDocument) {
    socket.emit(event, doc);
  };
}

function removeListener(event: string, listener: Function) {
  return function () {
    ThingEvents.removeListener(event, listener);
  };
}
