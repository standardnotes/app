'use strict';

var Neeto = Neeto || {};
var SN = SN || {};

// detect IE8 and above, and edge.
// IE and Edge do not support pbkdf2 in WebCrypto, therefore we need to use CryptoJS
var IEOrEdge = document.documentMode || /Edge/.test(navigator.userAgent);

if(!IEOrEdge && (window.crypto && window.crypto.subtle)) {
  Neeto.crypto = new SNCryptoWeb();
} else {
  Neeto.crypto = new SNCryptoJS();
}

angular.module('app.frontend', [
  'ui.router',
  'restangular'
])

.config(function (RestangularProvider, authManagerProvider) {
  RestangularProvider.setDefaultHeaders({"Content-Type": "application/json"});

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

Neeto.util = {
  getParameterByName: function(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
}
