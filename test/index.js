// Copyright 2016 Udia Software Incorporated
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var config = require('./config');
var utils = require('nodejs-repo-tools');

describe(config.test + '/', function() {
  var topicName;

  before(function() {
    var appConfig = require('../config');
    topicName = appConfig.get('TOPIC_NAME');
    appConfig.set('TOPIC_NAME', topicName + '-' + config.test);
  });

  if (!process.env.E2E_TESTS) {
    it('should install dependencies', function(done) {
      this.timeout(120 * 1000); // Allow 2 minutes to test installation
      utils.testInstallation(config, done);
    });
  }
  require('./app.test');
  require('./worker.test');
  describe('books/', function() {
    var appConfig = require('../config');
    var DATA_BACKEND = appConfig.get('DATA_BACKEND');
    if (DATA_BACKEND === 'datastore' || process.env.TEST_DATASTORE) {
      require('./api.test')('datastore');
      require('./crud.test')('datastore');
    }
    if (DATA_BACKEND === 'cloudsql' || process.env.TEST_CLOUDSQL) {
      require('./api.test')('cloudsql');
      require('./crud.test')('cloudsql');
    }
    if (DATA_BACKEND === 'mongodb' || process.env.TEST_MONGODB) {
      require('./api.test')('mongodb');
      require('./crud.test')('mongodb');
    }
  });
  if (!process.env.E2E_TESTS) {
    describe('lib/', function() {
      require('./background.test');
      require('./oauth2.test');
    });
  }

  afterEach(function() {
    var appConfig = require('../config');
    appConfig.set('TOPIC_NAME', topicName);
  });
});
