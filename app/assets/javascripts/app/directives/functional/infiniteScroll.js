angular.module('app').directive('infiniteScroll', [
'$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {
  return {
    link: function(scope, elem, attrs) {
      // elem.css('overflow-x', 'hidden');
      // elem.css('height', 'inherit');

      var offset = parseInt(attrs.threshold) || 0;
      var e = elem[0]

      elem.on('scroll', function(){
        if(scope.$eval(attrs.canLoad) && e.scrollTop + e.offsetHeight >= e.scrollHeight - offset) {
          scope.$apply(attrs.infiniteScroll);
        }
      });
    }
  };
}
]);
