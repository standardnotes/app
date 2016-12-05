angular.module('app.frontend')
.controller('UsernameModalCtrl', function ($scope, apiController, Restangular, user, callback, $timeout) {
  $scope.formData = {};

  $scope.saveUsername = function() {
    apiController.setUsername(user, $scope.formData.username, function(response){
      var username = response.root_path;
      user.presentation = response;
      callback(username);
      $scope.closeThisDialog();
    })
  }
});
