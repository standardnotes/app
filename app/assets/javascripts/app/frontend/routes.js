angular.module('app.frontend')
  .config(function ($locationProvider) {

    var runningInElectron = window && window.process && window.process.type && window.process.versions["electron"];
    if(!runningInElectron) {
      if (window.history && window.history.pushState) {
        $locationProvider.html5Mode({
          enabled: true,
          requireBase: false
        });
      }
    } else {
      $locationProvider.html5Mode(false);
    }

  });
