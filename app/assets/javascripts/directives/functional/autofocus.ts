/* @ngInject */
export function autofocus($timeout: ng.ITimeoutService) {
  return {
    restrict: 'A',
    scope: {
      shouldFocus: '='
    },
    link: function (
      $scope: ng.IScope,
      $element: JQLite
    ) {
      $timeout(() => {
        if (($scope as any).shouldFocus) {
          $element[0].focus();
        }
      });
    }
  };
}
