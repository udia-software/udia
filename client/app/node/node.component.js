'use strict';
const angular = require('angular');
const ngRoute = require('angular-route');


import routes from './node.routes';

export class NodeComponent {
  /*@ngInject*/
  constructor() {
    this.message = 'Hello';
  }
}

export default angular.module('udiaApp.node', [ngRoute])
  .config(routes)
  .component('node', {
    template: require('./node.html'),
    controller: NodeComponent,
    controllerAs: 'nodeCtrl'
  })
  .name;
