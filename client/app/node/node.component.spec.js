'use strict';

import node from './node.component';

describe('Component: NodeComponent', function() {
  // load the controller's module
  beforeEach(angular.mock.module(node));

  var NodeComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    NodeComponent = $componentController('node', {});
  }));

  it('should ...', function() {
    expect(1).toEqual(1);
  });
});
