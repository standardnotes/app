/* @ngInject */
export function trusted($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}
