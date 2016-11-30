'use strict';

import main from './main.component';
import {
  MainController
} from './main.component';

describe('Component: MainComponent', function() {
  beforeEach(angular.mock.module(main));
  beforeEach(angular.mock.module('socketMock'));

  var scope;
  var mainComponent;
  var $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function(_$httpBackend_, $http, $componentController, $rootScope, socket) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/things')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    mainComponent = $componentController('main', {
      $http,
      $scope: scope,
      socket
    });
  }));

  it('should attach a list of things to the controller', function() {
    mainComponent.$onInit();
    $httpBackend.flush();
    expect(mainComponent.awesomeThings.length)
      .toBe(4);
  });
});
