/**
 * Created by alexander on 2016-12-08.
 */
import * as mongoose from "mongoose";
import * as Promise from "bluebird";
import * as _ from "lodash";
import thingSchema from "./thing.schema";

thingSchema.static("getAll", (): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    let _query = {};
    Thing
      .find(_query)
      .exec((err, things) => {
        err ? reject(err)
          : resolve(things);
      });
  });
});

thingSchema.static("createThing", (thing: Object): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    if (!_.isObject(thing)) {
      return reject(new TypeError("Thing is not a valid object."));
    }
    let _thing = new Thing(thing);
    _thing.save((err, saved) => {
      err ? reject(err)
        : resolve(saved);
    })
  })
});

thingSchema.static("deleteThing", (id: string): Promise<any> => {
  return new Promise((resolve: Function, reject: Function) => {
    if (!_.isString(id)) {
      return reject(new TypeError("ID is not a valid string."));
    }
    Thing
      .findByIdAndRemove(id)
      .exec((err, deleted) => {
        err ? reject(err)
          : resolve();
      });
  })
});

let Thing = mongoose.model("Thing", thingSchema);

export default Thing;
