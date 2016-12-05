angular.module('app.frontend')
  .controller('BaseCtrl', function ($rootScope, $scope, $state, $auth, apiController) {
    $rootScope.$on('auth:password-change-success', function(ev) {
      $state.go("home");
    });

    $rootScope.$on('auth:password-change-error', function(ev, reason) {
      alert("Error: " + reason);
    });

    $rootScope.resetPasswordSubmit = function() {
      var new_keys = Neeto.crypto.generateEncryptionKeysForUser($rootScope.resetData.password, $rootScope.resetData.email);
      var data = _.clone($rootScope.resetData);
      data.password = new_keys.pw;
      data.password_confirmation = new_keys.pw;
      $auth.updatePassword(data);
      apiController.setGk(new_keys.gk);
    }

  });
