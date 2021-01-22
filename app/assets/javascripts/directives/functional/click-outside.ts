/* @ngInject */
export function clickOutside($document: ng.IDocumentService) {
  return {
    restrict: 'A',
    replace: false,
    link($scope: ng.IScope, $element: JQLite, attrs: any) {
      let didApplyClickOutside = false;

      function onElementClick(event: JQueryEventObject) {
        didApplyClickOutside = false;
        if (attrs.isOpen) {
          event.stopPropagation();
        }
      }

      function onDocumentClick(event: JQueryEventObject) {
        /** Ignore click if on SKAlert */
        if (event.target.closest('.sk-modal')) {
          return;
        }
        if (!didApplyClickOutside) {
          $scope.$apply(attrs.clickOutside);
          didApplyClickOutside = true;
        }
      }

      $scope.$on('$destroy', () => {
        attrs.clickOutside = undefined;
        $element.unbind('click', onElementClick);
        $document.unbind('click', onDocumentClick);
      });

      $element.bind('click', onElementClick);
      $document.bind('click', onDocumentClick);
    }
  };
}
