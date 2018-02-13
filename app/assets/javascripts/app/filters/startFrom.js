angular.module('app').filter('startFrom', function() {
    return function(input, start) {
        return input.slice(start);
      };
});
