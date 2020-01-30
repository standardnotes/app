/* @ngInject */
export function infiniteScroll($rootScope, $window, $timeout) {
  return {
    link: function(scope, elem, attrs) {
      const offset = parseInt(attrs.threshold) || 0;
      const e = elem[0];
      elem.on('scroll', function() {
        if (
          scope.$eval(attrs.canLoad) &&
          e.scrollTop + e.offsetHeight >= e.scrollHeight - offset
        ) {
          scope.$apply(attrs.infiniteScroll);
        }
      });
    }
  };
}
