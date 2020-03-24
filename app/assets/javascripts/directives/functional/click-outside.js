/* @ngInject */
export function clickOutside($document) {
  return {
    restrict: 'A',
    replace: false,
    link: function ($scope, $element, attrs) {
      // Causes memory leak as-is:
      // let didApplyClickOutside = false;

      // $scope.$on('$destroy', () => {
      //   attrs.clickOutside = null;
      //   $element.unbind('click', $scope.onElementClick);
      //   $document.unbind('click', $scope.onDocumentClick);
      //   $scope.onElementClick = null;
      //   $scope.onDocumentClick = null;
      // });

      // $scope.onElementClick = (event) => {
      //   didApplyClickOutside = false;
      //   if (attrs.isOpen) {
      //     event.stopPropagation();
      //   }
      // };
      
      // $scope.onDocumentClick = (event) => {
      //   /* Ignore click if on SKAlert */
      //   if (event.target.closest('.sk-modal')) {
      //     return;
      //   }
      //   if (!didApplyClickOutside) {
      //     $scope.$apply(attrs.clickOutside);
      //     didApplyClickOutside = true;
      //   }
      // };

      // $element.bind('click', $scope.onElementClick);
      // $document.bind('click', $scope.onDocumentClick);
    }
  };
}
