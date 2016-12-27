angular.module('app.frontend')
  .filter('appDate', function ($filter) {
      return function (input) {
          return input ? $filter('date')(new Date(input), 'MM/dd/yyyy', 'UTC') : '';
      };
  })
  .filter('appDateTime', function ($filter) {
      return function (input) {
          return input ? $filter('date')(new Date(input), 'MM/dd/yyyy h:mm a') : '';
      };
  });
