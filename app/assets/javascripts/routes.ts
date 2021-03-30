import { isDesktopApplication } from './utils';

/* @ngInject */
export function configRoutes($locationProvider: ng.ILocationProvider) {
  if (!isDesktopApplication()) {
    if (typeof window?.history?.pushState === 'function') {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      });
    }
  } else {
    $locationProvider.html5Mode(false);
  }
}
