// An interface used by the Desktop app to interact with SN

class DesktopManager {

  constructor($rootScope, $timeout, modelManager, syncManager, authManager, passcodeManager) {
    this.passcodeManager = passcodeManager;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.syncManager = syncManager;
    this.$rootScope = $rootScope;
    this.timeout = $timeout;
    this.updateObservers = [];

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

  /*
    Sending a component in its raw state is really slow for the desktop app
    Keys are not passed into ItemParams, so the result is not encrypted
   */
  async convertComponentForTransmission(component) {
    return new ItemParams(component).paramsForExportFile(true);
  }

  // All `components` should be installed
  syncComponentsInstallation(components) {
    if(!this.isDesktop) return;

    Promise.all(components.map((component) => {
      return this.convertComponentForTransmission(component);
    })).then((data) => {
      this.installationSyncHandler(data);
    })
  }

  async installComponent(component) {
    this.installComponentHandler(await this.convertComponentForTransmission(component));
  }

  registerUpdateObserver(callback) {
    var observer = {id: Math.random, callback: callback};
    this.updateObservers.push(observer);
    return observer;
  }

  searchText(text) {
    if(!this.isDesktop) {
      return;
    }
    this.searchHandler(text);
  }


  deregisterUpdateObserver(observer) {
    _.pull(this.updateObservers, observer);
  }

  // Pass null to cancel search
  desktop_setSearchHandler(handler) {
    this.searchHandler = handler;
  }

  desktop_onComponentInstallationComplete(componentData, error) {
    console.log("Web|Component Installation/Update Complete", componentData, error);

    // Desktop is only allowed to change these keys:
    let permissableKeys = ["package_info", "local_url"];
    var component = this.modelManager.findItem(componentData.uuid);

    if(!component) {
      console.error("desktop_onComponentInstallationComplete component is null for uuid", componentData.uuid);
      return;
    }

    if(error) {
      component.setAppDataItem("installError", error);
    } else {
      for(var key of permissableKeys) {
        component[key] = componentData.content[key];
      }
      this.modelManager.notifySyncObserversOfModels([component], ModelManager.MappingSourceDesktopInstalled);
      component.setAppDataItem("installError", null);
    }
    component.setDirty(true);
    this.syncManager.sync("onComponentInstallationComplete");

    this.timeout(() => {
      for(var observer of this.updateObservers) {
        observer.callback(component);
      }
    })
  }

  /* Used to resolve "sn://" */
  desktop_setApplicationDataPath(path) {
    this.applicationDataPath = path;
  }

  desktop_setComponentInstallationSyncHandler(handler) {
    this.installationSyncHandler = handler;
  }

  desktop_setInstallComponentHandler(handler) {
    this.installComponentHandler = handler;
  }

  desktop_setInitialDataLoadHandler(handler) {
    this.dataLoadHandler = handler;
    if(this.dataLoaded) {
      this.dataLoadHandler();
    }
  }

  desktop_requestBackupFile(callback) {
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

    this.modelManager.getAllItemsJSONData(
      keys,
      authParams,
      protocolVersion,
      true /* return null on empty */
    ).then((data) => {
      callback(data);
    })
  }

  desktop_setMajorDataChangeHandler(handler) {
    this.majorDataChangeHandler = handler;
  }

}

angular.module('app').service('desktopManager', DesktopManager);
