// An interface used by the Desktop app to interact with SN

class DesktopManager {

  constructor($rootScope, modelManager, authManager) {
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.$rootScope = $rootScope;

    $rootScope.$on("initial-data-loaded", () => {
      this.dataLoaded = true;
      if(this.dataLoadHandler) {
        this.dataLoadHandler();
      }
    });

    $rootScope.$on("major-data-change", () => {
      if(this.majorDataChangeHandler) {
        this.majorDataChangeHandler();
      }
    })
  }

  desktop_setInitialDataLoadHandler(handler) {
    this.dataLoadHandler = handler;
    if(this.dataLoaded) {
      this.dataLoadHandler();
    }
  }

  desktop_requestBackupFile() {
    let data = this.modelManager.getAllItemsJSONData(
      this.authManager.keys(),
      this.authManager.getAuthParams(),
      this.authManager.protocolVersion(),
      true /* return null on empty */
    );
    return data;
  }

  desktop_setMajorDataChangeHandler(handler) {
    this.majorDataChangeHandler = handler;
  }

}

angular.module('app.frontend').service('desktopManager', DesktopManager);
