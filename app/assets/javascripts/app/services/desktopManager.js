// An interface used by the Desktop app to interact with SN

class DesktopManager {

  constructor($rootScope, modelManager, syncManager, authManager, passcodeManager) {
    this.passcodeManager = passcodeManager;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.syncManager = syncManager;
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

  getApplicationDataPath() {
    console.assert(this.applicationDataPath, "applicationDataPath is null");
    return this.applicationDataPath;
  }

  /* Sending a component in its raw state is really slow for the desktop app */
  convertComponentForTransmission(component) {
    return new ItemParams(component).paramsForExportFile(true);
  }

  // All `components` should be installed
  syncComponentsInstallation(components) {
    // console.log("Web Syncing Components", components);
    if(!this.isDesktop) return;

    var data = components.map((component) => {
      console.log("Web Sycying Component", this.convertComponentForTransmission(component));
      return this.convertComponentForTransmission(component);
    })
    this.installationSyncHandler(data);
  }

  desktop_onComponentInstallationComplete(componentData) {
    console.log("Web|Component Installation Complete", componentData);
    var component = this.modelManager.mapResponseItemsToLocalModels([componentData], ModelManager.MappingSourceDesktopInstalled)[0];
    component.setDirty(true);
    this.syncManager.sync();
  }

  desktop_updateComponentComplete(componentData) {
    console.log("Web|Component Update Complete", componentData);
    var component = this.modelManager.mapResponseItemsToLocalModels([componentData], ModelManager.MappingSourceDesktopInstalled)[0];
    component.setDirty(true);
    this.syncManager.sync();
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
