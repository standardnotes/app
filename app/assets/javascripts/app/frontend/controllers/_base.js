class BaseCtrl {
  constructor($rootScope, modelManager, apiController) {
    apiController.getCurrentUser(function(){});
  }
}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
