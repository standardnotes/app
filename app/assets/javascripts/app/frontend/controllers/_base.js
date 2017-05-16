class BaseCtrl {
  constructor(syncManager, dbManager, analyticsManager) {
    dbManager.openDatabase(null, function(){
      // new database, delete syncToken so that items can be refetched entirely from server
      syncManager.clearSyncToken();
      syncManager.sync();
    })
  }
}


function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
