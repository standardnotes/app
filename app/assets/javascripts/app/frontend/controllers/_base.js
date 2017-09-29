class BaseCtrl {
  constructor($rootScope, $scope, syncManager, dbManager, componentManager) {
    dbManager.openDatabase(null, function(){
      // new database, delete syncToken so that items can be refetched entirely from server
      syncManager.clearSyncToken();
      syncManager.sync();
    })

    $scope.onUpdateAvailable = function(version) {
      $rootScope.$broadcast('new-update-available', version);
    }
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

function parametersFromURL(url) {
  url = url.split("?").slice(-1)[0];
  var obj = {};
  url.replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
    obj[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return obj;
}

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
