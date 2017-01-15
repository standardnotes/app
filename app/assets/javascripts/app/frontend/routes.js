angular.module('app.frontend')
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

    $stateProvider
      .state('base', {
        abstract: true,
      })

      .state('home', {
        url: '/',
        parent: 'base',
        views: {
          'content@' : {
            templateUrl: 'frontend/home.html',
            controller: 'HomeCtrl'
          }
        }
      })

      // Default fall back route
      $urlRouterProvider.otherwise(function($injector, $location){
         var state = $injector.get('$state');
         state.go('home');
         return $location.path();
      });

      var runningInElectron = window && window.process && window.process.type && window.process.versions["electron"];
      if(!runningInElectron) {
        console.log("Enabling HTML5 Mode.")
        if (window.history && window.history.pushState) {
          $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
          });
        }
      } else {
        $locationProvider.html5Mode(false);
        console.log("Disabling HTML5 Mode.")
      }

  });
