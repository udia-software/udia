'use strict';

export default function($routeProvider) {
  'ngInject';
  $routeProvider
    .when('/node', {
      template: '<node></node>'
    });
}
