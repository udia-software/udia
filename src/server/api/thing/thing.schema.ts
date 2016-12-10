/**
 * Created by alexander on 2016-12-08.
 */
import * as mongoose from "mongoose";

// To reference this interface:
// import {Thing} from "./thing.schema";
export interface Thing {
  message: string;
  createdAt: Date;
}
// To reference this mongoose.Schema:
// import thingSchema from "./thing.schema";
let schema = new mongoose.Schema({
  message: {
    type: String, required: true, trim: true
  },
  createdAt: {type: Date, default: Date.now}
});

export default schema;
