/* @ngInject */
export function autofocus($timeout) {
  return {
    restrict: 'A',
    scope: {
      shouldFocus: '='
    },
    link: function($scope, $element) {
      $timeout(function() {
        if ($scope.shouldFocus) {
          $element[0].focus();
        }
      });
    }
  };
}
