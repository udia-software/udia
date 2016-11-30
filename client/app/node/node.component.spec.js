'use strict';

describe('Component: NodeComponent', function() {
  // load the controller's module
  beforeEach(module('udiaApp.node'));

  var NodeComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    NodeComponent = $componentController('node', {});
  }));

  it('should ...', function() {
    expect(1).toEqual(1);
  });
});
