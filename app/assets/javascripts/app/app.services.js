'use strict';

angular
  .module('app.services', [
    'restangular'
  ])

  // Configure path to API
  .config(function (RestangularProvider, apiControllerProvider) {
    var url = apiControllerProvider.defaultServerURL();
    RestangularProvider.setBaseUrl(url);
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
