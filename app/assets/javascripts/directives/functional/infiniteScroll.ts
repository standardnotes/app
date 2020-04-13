/* @ngInject */
export function infiniteScroll() {
  return {
    link: function (scope: ng.IScope, elem: JQLite, attrs: any) {
      const scopeAny = scope as any;
      const offset = parseInt(attrs.threshold) || 0;
      const e = elem[0];
      scopeAny.onScroll = () => {
        if (
          scope.$eval(attrs.canLoad) &&
          e.scrollTop + e.offsetHeight >= e.scrollHeight - offset
        ) {
          scope.$apply(attrs.infiniteScroll);
        }
      };
      elem.on('scroll', scopeAny.onScroll);
      scope.$on('$destroy', () => {
        elem.off('scroll', scopeAny.onScroll);;
      });
    }
  };
}
