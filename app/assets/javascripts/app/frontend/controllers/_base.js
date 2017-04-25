class BaseCtrl {
  constructor(syncManager, dbManager, analyticsManager) {
    dbManager.openDatabase(null, function(){
      // new database, delete syncToken so that items can be refetched entirely from server
      syncManager.clearSyncToken();
      syncManager.sync();
    })
  }
}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
