import { debounce } from '@/utils';
/* @ngInject */
export function infiniteScroll() {
  return {
    link: function (scope: ng.IScope, elem: JQLite, attrs: any) {
      const scopeAny = scope as any;
      const offset = parseInt(attrs.threshold) || 0;
      const element = elem[0];
      scopeAny.paginate = debounce(() => {
        scope.$apply(attrs.infiniteScroll);
      }, 10);
      scopeAny.onScroll = () => {
        if (
          scope.$eval(attrs.canLoad) &&
          element.scrollTop + element.offsetHeight >= element.scrollHeight - offset
        ) {
          scopeAny.paginate();
        }
      };
      elem.on('scroll', scopeAny.onScroll);
      scope.$on('$destroy', () => {
        elem.off('scroll', scopeAny.onScroll);
      });
    }
  };
}
