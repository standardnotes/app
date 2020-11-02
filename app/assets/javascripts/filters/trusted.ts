/* @ngInject */
export function trusted($sce: ng.ISCEService) {
  return function(url: string) {
    return $sce.trustAsResourceUrl(url);
  };
}
