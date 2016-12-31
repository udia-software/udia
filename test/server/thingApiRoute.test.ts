/**
 * Created by udia on 2016-12-30.
 */
import * as chai from "chai";
import chaiHttp = require("chai-http");
import app from "./app";

chai.use(chaiHttp);
const expect = chai.expect;

describe('Thing API:', () => {

  let id = "";

  describe("GET /api/things", () => {
    it("should respond with an array of Things", (done) => {
      chai.request(app).get("/api/things")
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.body).to.be.an("array");
          done();
        });
    });
  });

  describe("POST /api/things", () => {
    it("should respond with a newly created Thing object", (done) => {
      chai.request(app).post("/api/things")
        .send({
          message: "Hello World!"
        })
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.status).to.equal(201);
          expect(res.body).to.include({message: "Hello World!"});
          expect(res.body).to.include.keys(["_id", "createdAt"]);
          id = res.body._id;
          done();
        });
    });
  });

  describe("DELETE /api/things/{id}", () => {
    it("should delete the created Thing object", (done) => {
      chai.request(app).del("/api/things/" + id)
        .end((err, res) => {
          expect(res.status).to.equal(204);
          done();
        });
    });
  });
});