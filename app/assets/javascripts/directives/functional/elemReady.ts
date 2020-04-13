/* @ngInject */
export function elemReady($parse: ng.IParseService) {
  return {
    restrict: 'A',
    link: function($scope: ng.IScope, elem: JQLite, attrs: any) {
      elem.ready(function() {
        $scope.$apply(function() {
          var func = $parse(attrs.elemReady);
          func($scope);
        });
      });
    }
  };
}
