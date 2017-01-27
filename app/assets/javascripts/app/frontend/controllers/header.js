angular.module('app.frontend')
  .directive("header", function(apiController){
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'frontend/header.html',
      replace: true,
      controller: 'HeaderCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$on("sync:updated_token", function(){
          ctrl.syncUpdated();
          ctrl.findErrors();
        })
        scope.$on("sync:error", function(){
          ctrl.findErrors();
        })
      }
    }
  })
  .controller('HeaderCtrl', function (apiController, modelManager, $timeout, dbManager, syncManager) {

    this.user = apiController.user;
    this.offline = syncManager.offline;

    this.findErrors = function() {
      this.error = syncManager.syncProviders.filter(function(provider){return provider.error}).length > 0 ? true : false;
    }
    this.findErrors();


    this.accountMenuPressed = function() {
      this.serverData = {};
      this.showAccountMenu = !this.showAccountMenu;
      this.showFaq = false;
      this.showNewPasswordForm = false;
      this.showExtensionsMenu = false;
      this.showIOMenu = false;
    }

    this.toggleExtensions = function() {
      this.showAccountMenu = false;
      this.showIOMenu = false;
      this.showExtensionsMenu = !this.showExtensionsMenu;
    }

    this.toggleIO = function() {
      this.showIOMenu = !this.showIOMenu;
      this.showExtensionsMenu = false;
      this.showAccountMenu = false;
    }

    this.refreshData = function() {
      this.isRefreshing = true;
      syncManager.sync(function(response){
        $timeout(function(){
          this.isRefreshing = false;
        }.bind(this), 200)
        if(response && response.error) {
          alert("There was an error syncing. Please try again. If all else fails, log out and log back in.");
        } else {
          this.syncUpdated();
        }
      }.bind(this));
    }

    this.syncUpdated = function() {
      this.lastSyncDate = new Date();
    }
});
