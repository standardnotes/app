class BaseCtrl {
  constructor($rootScope, modelManager) {
    // $rootScope.resetPasswordSubmit = function() {
    //   var new_keys = Neeto.crypto.generateEncryptionKeysForUser($rootScope.resetData.password, $rootScope.resetData.email);
    //   var data = _.clone($rootScope.resetData);
    //   data.password = new_keys.pw;
    //   data.password_confirmation = new_keys.pw;
    //   $auth.updatePassword(data);
    //   apiController.setMk(new_keys.mk);
    // }
  }
}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
