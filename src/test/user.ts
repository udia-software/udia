import "mocha";
import {IUser} from "../interfaces/user";
import {IUserModel} from "../models/user";
import {userSchema} from "../schemas/user";

global.Promise = require("q").Promise;
import mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// Connect to Mongoose and Create Model
const MONGODB_CONNECTION: string = "mongodb://localhost:27017/udia";
let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);
let User: mongoose.Model<IUserModel> = connection.model<IUserModel>("User", userSchema);

// require chai, use should() assertions
let chai = require("chai");

chai.should();
describe("User", function () {
    describe("create()", function () {
        it("should create a new User", function () {
            //user object
            let user: IUser = {
                email: "foo@bar.com",
                firstName: "Alexander",
                lastName: "Wong"
            };
            return new User(user).save().then(result => {
                result._id.should.exist;
                result.email.should.equal(user.email);
                result.firstName.should.equal(user.firstName);
                result.lastName.should.equal(user.lastName);
            })
        });
    })
});
