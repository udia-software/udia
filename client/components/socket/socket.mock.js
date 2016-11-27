'use strict';

const angular = require('angular');

angular.module('socketMock', [])
  .factory('socket', function() {
    return {
      socket: {
        connect() {},
        on() {},
        emit() {},
        receive() {}
      },

      syncUpdates() {},
      unsyncUpdates() {}
    };
  });
