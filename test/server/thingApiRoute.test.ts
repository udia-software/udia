/**
 * Created by udia on 2016-12-30.
 */
import * as chai from "chai";
import chaiHttp = require("chai-http");
import app from "./app";
import Thing from "../../src/server/api/thing/thing.dao";

chai.use(chaiHttp);
const expect = chai.expect;

describe("Thing API:", () => {

  let id = "";

  /**
   * Remove all 'Things' before the test begins.
   */
  before(done => {
    Thing.remove({}, done);
  });

  /**
   * Remove all 'Things' after the test finishes.
   */
  after(done => {
    Thing.remove({}, done);
  });

  describe("GET /api/things", () => {
    it("should respond with an array of Things", done => {
      chai.request(app).get("/api/things")
        .end((err, res) => {
          expect(res.type).to.equal("application/json");
          expect(res.body).to.be.an("array");
          done();
        });
    });

    it("should respond with a populated array of Things", done => {
      let _thing = new Thing({message: "Create a thing."});
      _thing.save()
        .then(() => {
          chai.request(app).get("/api/things")
            .end((err, res) => {
              expect(res.type).to.equal("application/json");
              expect(res.body).to.be.an("array");
              expect(res.body.length).to.equal(1);
              expect(res.body[0]).to.include({message: "Create a thing."});
              expect(res.body[0]).to.include.keys(["_id", "createdAt"]);
              done();
            });
        });
    })
  });

  describe("POST /api/things", () => {
    it("should respond with a newly created Thing object", done => {
      chai.request(app).post("/api/things")
        .send({
          message: "Hello World!"
        })
        .end((err, res) => {
          // Verify the REST API
          expect(res.type).to.equal("application/json");
          expect(res.status).to.equal(201);
          expect(res.body).to.include({message: "Hello World!"});
          expect(res.body).to.include.keys(["_id", "createdAt"]);
          id = res.body._id;
          // Verify that the object is in Mongo
          Thing.findById(id).then(_thing => {
            expect(_thing._id.toString()).to.equal(id);
            expect(_thing.get("message")).to.equal("Hello World!");
            done();
          });
        });
    });
  });

  describe("DELETE /api/things/{id}", () => {
    it("should delete the created Thing object", done => {
      chai.request(app).del("/api/things/" + id)
        .end((err, res) => {
          // Verify the REST API
          expect(res.status).to.equal(204);
          // Verify that the object is gonzo
          Thing.findById(id).then(_thing => {
            expect(_thing).to.equal(null);
            done();
          });
        });
    });
  });
});