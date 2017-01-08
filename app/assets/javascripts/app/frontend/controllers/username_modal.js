angular.module('app.frontend')
.controller('UsernameModalCtrl', function ($scope, apiController, Restangular, callback, $timeout) {
  $scope.formData = {};

  $scope.saveUsername = function() {
    apiController.setUsername($scope.formData.username, function(response){
      var username = response.username;
      callback(username);
      $scope.closeThisDialog();
    })
  }
});
