angular.module('app.frontend').filter('startFrom', function() {
    return function(input, start) {
        return input.slice(start);
      };
});
