/* @ngInject */
export function infiniteScroll() {
  return {
    link: function(scope, elem, attrs) {
      const offset = parseInt(attrs.threshold) || 0;
      const e = elem[0];
      scope.onScroll = () => {
        if (
          scope.$eval(attrs.canLoad) &&
          e.scrollTop + e.offsetHeight >= e.scrollHeight - offset
        ) {
          scope.$apply(attrs.infiniteScroll);
        }
      };
      elem.on('scroll', scope.onScroll);
      scope.$on('$destroy', () => {
        elem.off('scroll', scope.onScroll);;
      });
    }
  };
}
