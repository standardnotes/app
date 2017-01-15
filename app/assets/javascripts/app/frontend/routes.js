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

      var runningInElectron = process.versions['electron'];
      if(!runningInElectron) {
        if (window.history && window.history.pushState) {
          $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
          });
        }
      }

  });
