angular
  .module('app.frontend')
  .directive('clickOutside', ['$document', function($document) {
    return {
      restrict: 'A',
      replace: false,
      link : function($scope, $element, attrs) {

        var didApplyClickOutside = false;

        $element.bind('click', function(e) {
          didApplyClickOutside = false;
          if (attrs.isOpen) {
            e.stopPropagation();
          }
        });

        $document.bind('click', function() {
          if(!didApplyClickOutside) {
            $scope.$apply(attrs.clickOutside);
            didApplyClickOutside = true;
          }
        })

      }
    }
  }]);
