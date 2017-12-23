// An interface used by the Desktop app to interact with SN

class DesktopManager {

  constructor($rootScope, modelManager, authManager, passcodeManager) {
    this.passcodeManager = passcodeManager;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.$rootScope = $rootScope;

    this.isDesktop = isDesktopApplication();

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

  /* Can handle components and themes */
  installOfflineComponentFromData(componentData, callback) {
    this.componentInstallationHandler(componentData, (installedComponent) => {
      componentData.content.url = installedComponent.content.url;
      componentData.content.local = true;
      callback(componentData);
    });
  }

  getApplicationDataPath() {
    console.assert(this.applicationDataPath, "applicationDataPath is null");
    return this.applicationDataPath;
  }

  /* Sending a component in its raw state is really slow for the desktop app */
  convertComponentForTransmission(component) {
    return new ItemParams(component).paramsForExportFile();
  }

  // All `components` should be installed
  syncComponentsInstallation(components) {
    if(!this.isDesktop) return;
    var data = components.map((component) => {
      return this.convertComponentForTransmission(component);
    })
    this.installationSyncHandler(data);
  }

  /* Used to resolve "sn://" */
  desktop_setApplicationDataPath(path) {
    this.applicationDataPath = path;
  }

  desktop_setComponentInstallationSyncHandler(handler) {
    this.installationSyncHandler = handler;
  }

  desktop_setOfflineComponentInstallationHandler(handler) {
    this.componentInstallationHandler = handler;
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
