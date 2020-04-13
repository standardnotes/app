/* @ngInject */
export function selectOnClick($window: ng.IWindowService) {
  return {
    restrict: 'A',
    link: function(scope: ng.IScope, element: JQLite) {
      element.on('focus', () => {
        if (!$window.getSelection()!.toString()) {
          const input = element[0] as HTMLInputElement;
          /** Required for mobile Safari */
          input.setSelectionRange(0, input.value.length);
        }
      });
    }
  };
}
