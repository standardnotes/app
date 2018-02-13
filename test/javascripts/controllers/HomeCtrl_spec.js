describe("app", function() {

  beforeEach(module('app'));

  describe('Home Controller', function() {

    var scope;
    beforeEach(inject(function($rootScope, $controller, modelManager) {
      scope = $rootScope.$new();
      $modelManager = modelManager;
      $controller("HomeCtrl", {
        $scope: scope,
      });
    }));

    it('should have an All tag', function() {
      expect(scope.allTag).toBeDefined();
      expect(scope.allTag.title).toEqual("All");
    });

    it('should have notes and tags model managers', function() {
      expect($modelManager.tags).toBeDefined();
      expect($modelManager.notes).toBeDefined();
    });

    it('should be able to add a new tag', function() {
      scope.tagsAddNew("testTag");
      expect($modelManager.items).toContain("testTag");
    });

  });

});
