'use strict';

var Neeto = Neeto || {};

// detect IE8 and above, and edge.
// IE and Edge do not support pbkdf2 in WebCrypto, therefore we need to use CryptoJS
var IEOrEdge = document.documentMode || /Edge/.test(navigator.userAgent);

if(!IEOrEdge && (window.crypto && window.crypto.subtle)) {
  console.log("Using webcrypto");
  Neeto.crypto = new SNCryptoWeb();
} else {
  console.log("Using CryptoJS");
}
Neeto.crypto = new SNCryptoJS();

angular.module('app.frontend', [
  'ui.router',
  'restangular'
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
