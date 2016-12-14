'use strict';

angular
  .module('app.services', [
    'restangular'
  ])

  // Configure path to API
  .config(function (RestangularProvider, apiControllerProvider) {
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

  // Shared function for configure auth service. Can be overwritten.
  function configureAuth ($authProvider, apiControllerProvider) {
    var url = apiControllerProvider.defaultServerURL();
    $authProvider.configure([{
      default: {
        apiUrl: url,
        passwordResetSuccessUrl: window.location.protocol + '//' + window.location.host + '/auth/reset',
      }
    }]);
  }
