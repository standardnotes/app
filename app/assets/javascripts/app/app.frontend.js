'use strict';

var Neeto = Neeto || {};

if(window.crypto.subtle) {
  Neeto.crypto = new SNCryptoWeb();
} else {
  Neeto.crypto = new SNCryptoJS();
}

angular.module('app.frontend', [
  'ui.router',
  'restangular',
  'ngDialog'
])

.config(function (RestangularProvider, apiControllerProvider) {
  RestangularProvider.setDefaultHeaders({"Content-Type": "application/json"});

  var url = apiControllerProvider.defaultServerURL();
  RestangularProvider.setBaseUrl(url + "/api");

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
