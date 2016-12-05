angular.module('app.frontend')
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

    $stateProvider
      .state('base', {
        abstract: true,
      })

      // Homepage
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

      .state('presentation', {
        url: '/:root_path',
        parent: 'base',
        views: {
          'content@' : {
            templateUrl: 'frontend/presentation.html',
            controller: "PresentationCtrl"
          }
        },
        resolve: {
          presentation: getPresentation
        }
      })

      .state('group', {
        url: '/:root_path/:secondary_path',
        parent: 'base',
        views: {
          'content@' : {
            templateUrl: 'frontend/presentation.html',
            controller: "PresentationCtrl"
          }
        },
        resolve: {
          presentation: getPresentation
        }
      })

      // Auth routes
      .state('auth', {
          abstract: true,
          url: '/auth',
          parent: 'base',
          views: {
            'content@' : {
              templateUrl: 'frontend/auth/wrapper.html',
            }
          }
      })
      .state('auth.login', {
          url: '/login',
          templateUrl: 'frontend/auth/login.html',
      })
      .state('auth.forgot', {
          url: '/forgot',
          templateUrl: 'frontend/auth/forgot.html',
      })
      .state('auth.reset', {
          url: '/reset?reset_password_token&email',
          templateUrl: 'frontend/auth/reset.html',
          controller: function($rootScope, $stateParams) {
            $rootScope.resetData = {reset_password_token: $stateParams.reset_password_token, email: $stateParams.email};

            // Clear reset_password_token on change state
            $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
              $rootScope.reset_password_token = null;
            });
          },
      })


      // 404 Error
      .state('404', {
        parent: 'base',
        views: {
          'content@' : {
            templateUrl: 'frontend/errors/404.html'
          }
        }
      });

      function getPresentation ($q, $state, $stateParams, Restangular) {
        var deferred = $q.defer();
        var restangularQuery = Restangular.one('presentations', 'show_by_path');
        restangularQuery.get({root_path: $stateParams.root_path, secondary_path: $stateParams.secondary_path})
        .then(function(response) {
          deferred.resolve(response);
        })
        .catch(function(response) {
          $state.go('404');
        });

        return deferred.promise;
      }

      // Default fall back route
      $urlRouterProvider.otherwise(function($injector, $location){
         var state = $injector.get('$state');
         state.go('404');
         return $location.path();
      });

      // enable HTML5 Mode for SEO
      $locationProvider.html5Mode(true);

  });
