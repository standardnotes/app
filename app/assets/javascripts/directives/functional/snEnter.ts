/* @ngInject */
export function snEnter() {
  return function (
    scope: ng.IScope,
    element: JQLite,
    attrs: any
  ) {
    element.bind('keydown keypress', function (event) {
      if (event.which === 13) {
        scope.$apply(function () {
          scope.$eval(attrs.snEnter, { event: event });
        });

        event.preventDefault();
      }
    });
  };
}
