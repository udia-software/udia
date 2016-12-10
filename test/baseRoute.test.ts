/**
 * Created by alexander on 2016-12-09.
 */
import * as chai from "chai";
import chaiHttp = require("chai-http");

import server = require("../src/server/server");

chai.use(chaiHttp);
const expect = chai.expect;

let app = server.Server.bootstrap().app;

describe('baseRoute', () => {

  it('should be text/html', (done) => {
    chai.request(app).get('/')
      .end((err, res) => {
        expect(res.type).to.equal('text/html');
        done();
      });
  });

});