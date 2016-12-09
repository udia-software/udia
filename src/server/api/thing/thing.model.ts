/**
 * Created by alexander on 2016-12-08.
 */
import * as mongoose from "mongoose";

export interface Thing {
  message: string;
  createdAt: Date;
}

let schema = new mongoose.Schema({
  message: {
    type: String, required: true, trim: true
  },
  createdAt: {type: Date, default: Date.now}
});

export default schema;
