'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/admin', {
    template: require('./admin.html'),
    controller: 'AdminController',
    controllerAs: 'admin',
    authenticate: 'admin'
  });
}
