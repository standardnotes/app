/* @ngInject */
export function selectOnClick($window: ng.IWindowService) {
  return {
    restrict: 'A',
    link: function(scope: ng.IScope, element: JQLite) {
      element.on('focus', function() {
        if (!$window.getSelection()!.toString()) {
          const input = element as any;
          /** Required for mobile Safari */
          input.setSelectionRange(0, input.value.length);
        }
      });
    }
  };
}
