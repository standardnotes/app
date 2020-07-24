/* @ngInject */
export function fileChange() {
  return {
    restrict: 'A',
    scope: {
      handler: '&'
    },
    link: function (scope: ng.IScope, element: JQLite) {
      element.on('change', (event) => {
        scope.$apply(() => {
          const files = (event.target as HTMLInputElement).files;
          (scope as any).handler({
            files: files
          });
        });
      });
    }
  };
}
