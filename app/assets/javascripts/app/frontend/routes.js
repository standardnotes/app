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

      // Default fall back route
      $urlRouterProvider.otherwise(function($injector, $location){
         var state = $injector.get('$state');
         state.go('404');
         return $location.path();
      });

      // enable HTML5 Mode for SEO
      $locationProvider.html5Mode(true);

  });
