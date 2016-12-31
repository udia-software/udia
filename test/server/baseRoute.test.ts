/**
 * Created by alexander on 2016-12-09.
 */
import * as chai from "chai";
import chaiHttp = require("chai-http");
import app from "./app";

chai.use(chaiHttp);
const expect = chai.expect;

describe("Base Route", () => {
  it("should be text/html", (done) => {
    chai.request(app).get("/")
      .end((err, res) => {
        expect(res.type).to.equal("text/html");
        done();
      });
  });
});
