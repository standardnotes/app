/* @ngInject */
export function selectOnFocus($window: ng.IWindowService) {
  return {
    restrict: 'A',
    link: function (scope: ng.IScope, element: JQLite) {
      element.on('focus', () => {
        if (!$window.getSelection()!.toString()) {
          const input = element[0] as HTMLInputElement;
          /** Allow text to populate */
          setTimeout(() => {
            input.setSelectionRange(0, input.value.length);
          }, 0);
        }
      });
    }
  };
}
