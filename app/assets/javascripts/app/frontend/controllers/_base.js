class BaseCtrl {
  constructor($rootScope, modelManager, apiController, dbManager) {
    dbManager.openDatabase(null, function(){
      // new database, delete syncToken so that items can be refetched entirely from server
      apiController.clearSyncToken();
      apiController.sync();
    })
  }
}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
