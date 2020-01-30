import angular from 'angular';

/* @ngInject */
export function delayHide($timeout) {
  return {
    restrict: 'A',
    scope: {
      show: '=',
      delay: '@'
    },
    link: function(scope, elem, attrs) {
      showElement(false);

      // This is where all the magic happens!
      // Whenever the scope variable updates we simply
      // show if it evaluates to 'true' and hide if 'false'
      scope.$watch('show', function(newVal) {
        newVal ? showSpinner() : hideSpinner();
      });

      function showSpinner() {
        if (scope.hidePromise) {
          $timeout.cancel(scope.hidePromise);
          scope.hidePromise = null;
        }
        showElement(true);
      }

      function hideSpinner() {
        scope.hidePromise = $timeout(showElement.bind(this, false), getDelay());
      }

      function showElement(show) {
        show ? elem.css({ display: '' }) : elem.css({ display: 'none' });
      }

      function getDelay() {
        var delay = parseInt(scope.delay);

        return angular.isNumber(delay) ? delay : 200;
      }
    }
  };
}
