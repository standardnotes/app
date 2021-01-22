import angular from 'angular';

/* @ngInject */
export function delayHide($timeout: ng.ITimeoutService) {
  return {
    restrict: 'A',
    scope: {
      show: '=',
      delay: '@'
    },
    link: function (scope: ng.IScope, elem: JQLite) {
      const scopeAny = scope as any;
      const showSpinner = () => {
        if (scopeAny.hidePromise) {
          $timeout.cancel(scopeAny.hidePromise);
          scopeAny.hidePromise = null;
        }
        showElement(true);
      };

      const hideSpinner = () => {
        scopeAny.hidePromise = $timeout(
          showElement.bind(this as any, false),
          getDelay()
        );
      };

      const showElement = (show: boolean) => {
        show ? elem.css({ display: '' }) : elem.css({ display: 'none' });
      };

      const getDelay = () => {
        const delay = parseInt(scopeAny.delay);
        return angular.isNumber(delay) ? delay : 200;
      };

      showElement(false);
      // Whenever the scope variable updates we simply
      // show if it evaluates to 'true' and hide if 'false'
      scope.$watch('show', function (newVal) {
        newVal ? showSpinner() : hideSpinner();
      });
    }
  };
}
