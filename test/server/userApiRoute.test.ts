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
  let token: string;

  /**
   * Clear all users, then create one user for test purposes.
   */
  before(done => {
    User.remove({}, done);
  });

  /**
   * Remove all users after the test is finished.
   */
  after(done => {
    User.remove({}, done);
  });


  describe("POST /api/users/", () => {
    it("should create a new user with the given credentials", done => {
      chai.request(app).post("/api/users")
        .send({
          username: "alexander",
          password: "pass123 horse cow battery staple"
        })
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.status).to.equal(201);
          expect(res.body).to.have.key("token");
          token = res.body.token;
          done();
        });
    });
  });

  describe("POST /auth/local", () => {
    it("should respond with an error given improper credentials", done => {
      chai.request(app).post("/auth/local")
        .send({
          username: "alexander",
          password: "badpass"
        })
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.status).to.equal(401);
          expect(res.body).to.have.key("message");
          expect(res.body.message).to.equal("This password is not correct.");
          done();
        })
    });

    it("should respond with the JWT given proper credentials", done => {
      chai.request(app).post("/auth/local")
        .send({
          username: "alexander",
          password: "pass123 horse cow battery staple"
        })
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.status).to.equal(200);
          expect(res.body).to.have.key("token");
          expect(res.body.token).to.be.a("string");
          expect(res.body.token).to.equal(token);
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