import { isDesktopApplication } from './utils';

/* @ngInject */
export function configRoutes($locationProvider) {
  if (!isDesktopApplication()) {
    if (window.history && window.history.pushState) {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      });
    }
  } else {
    $locationProvider.html5Mode(false);
  }
}
