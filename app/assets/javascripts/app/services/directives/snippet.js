angular
  .module('app.frontend')
  .directive('note', function($timeout) {
    return {
      restrict: 'E',
      controller: 'SingleNoteCtrl',
      templateUrl: "frontend/directives/note.html",
      scope: {
        note: "="
      },
    }
  })
  .controller('SingleNoteCtrl', function ($rootScope, $scope, $state, markdownRenderer) {
    $scope.renderedContent = function() {
      return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText($scope.note.text));
    }
  });
