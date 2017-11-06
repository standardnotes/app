// An interface used by the Desktop app to interact with SN

class DesktopManager {

  constructor($rootScope, modelManager, authManager, passcodeManager) {
    this.passcodeManager = passcodeManager;
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
    var keys, authParams, protocolVersion;
    if(this.authManager.offline() && this.passcodeManager.hasPasscode()) {
      keys = this.passcodeManager.keys();
      authParams = this.passcodeManager.passcodeAuthParams();
      protocolVersion = authParams.version;
    } else {
      keys = this.authManager.keys();
      authParams = this.authManager.getAuthParams();
      protocolVersion = this.authManager.protocolVersion();
    }

    let data = this.modelManager.getAllItemsJSONData(
      keys,
      authParams,
      protocolVersion,
      true /* return null on empty */
    );
    return data;
  }

  desktop_setMajorDataChangeHandler(handler) {
    this.majorDataChangeHandler = handler;
  }

}

angular.module('app.frontend').service('desktopManager', DesktopManager);
