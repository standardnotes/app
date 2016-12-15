'use strict';

var Neeto = Neeto || {};

angular
  .module('app.frontend', [
    'ui.router',
    'ng-token-auth',
    'restangular',
    'ipCookie',
    'oc.lazyLoad',
    'angularLazyImg',
    'ngDialog'
  ])
  // Configure path to API
  .config(function (RestangularProvider, apiControllerProvider) {
    RestangularProvider.setDefaultHeaders({"Content-Type": "application/json"});

    var url = apiControllerProvider.defaultServerURL();
    RestangularProvider.setBaseUrl(url);

    RestangularProvider.setFullRequestInterceptor(function(element, operation, route, url, headers, params, httpConfig) {
      var token = localStorage.getItem("jwt");
      if(token) {
        headers = _.extend(headers, {Authorization: "Bearer " + localStorage.getItem("jwt")});
      }

      return {
        element: element,
        params: params,
        headers: headers,
        httpConfig: httpConfig
      };
    });
  })
