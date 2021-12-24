angular
  .module('app')
  .directive('mbAutofocus', ['$timeout', function($timeout) {
    return {
      restrict: 'A',
      scope: {
        shouldFocus: "="
      },
      link : function($scope, $element) {
        $timeout(function() {
          if($scope.shouldFocus) {
            $element[0].focus();
          }
        });
      }
    }
  }]);
