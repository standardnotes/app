'use strict';

var Neeto = Neeto || {};

angular
  .module('app.frontend', [
    'app.services',
    'ui.router',
    'ng-token-auth',
    'restangular',
    'ipCookie',
    'oc.lazyLoad',
    'angularLazyImg',
    'ngDialog',
  ])
  .config(configureAuth);
