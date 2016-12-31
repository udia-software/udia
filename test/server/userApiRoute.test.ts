/**
 * Created by udia on 2016-12-30.
 */
import * as chai from "chai";
import chaiHttp = require("chai-http");
import app from "./app";
import User from "../../src/server/api/user/user.dao";

chai.use(chaiHttp);
const expect = chai.expect;

describe("Authentication & User API:", () => {
  let user;

  /**
   * Clear all users, then create one user for test purposes.
   */
  before(done => {
    User.remove({}).then(() => {
      user = new User({
        username: "testuser",
        name: "Fake User",
        password: "password"
      });
      user.save(done);
    });
  });

  /**
   * Remove all users after the test is finished.
   */
  after(done => {
    User.remove({}, done);
  });

  describe("POST /auth/local", () => {
    it("should respond with the JWT given proper credentials", done => {
      chai.request(app).post("/auth/local")
        .send({
          username: "testuser",
          password: "password"
        })
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.status).to.equal(200);
          expect(res.body).to.be.a("string");
          console.log(res.body);
          done();
        })
    });
  });

  describe("GET /api/users/", () => {
    it("should respond with an array of Users", done => {
      chai.request(app).get("/api/users")
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.body).to.be.an("array");
          done();
        });
    });
  });
});