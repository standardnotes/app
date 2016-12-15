angular
  .module('app.frontend')
  .directive('fileChange', function() {
    return {
     restrict: 'A',
     scope: {
       handler: '&'
     },
     link: function (scope, element) {
      element.on('change', function (event) {
        scope.$apply(function(){
          scope.handler({files: event.target.files});
        });
      });
     }
    };
});
