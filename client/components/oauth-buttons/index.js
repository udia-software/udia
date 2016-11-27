'use strict';

import angular from 'angular';

export function OauthButtonsController($window) {
  'ngInject';

  this.loginOauth = function(provider) {
    $window.location.href = `/auth/${provider}`;
  };
}

export default angular.module('udiaApp.oauthButtons', [])
  .directive('oauthButtons', function() {
    return {
      template: require('./oauth-buttons.html'),
      restrict: 'EA',
      controller: OauthButtonsController,
      controllerAs: 'OauthButtons',
      scope: {
        classes: '@'
      }
    };
  })
  .name;
