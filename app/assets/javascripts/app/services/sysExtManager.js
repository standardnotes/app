/* A class for handling installation of system extensions */

class SysExtManager {

  constructor(modelManager, syncManager, singletonManager) {
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.singletonManager = singletonManager;

    this.extensionsIdentifier = "org.standardnotes.extensions-manager";
    this.systemExtensions = [];

    this.resolveExtensionsManager();
  }

  isSystemExtension(extension) {
    return this.systemExtensions.includes(extension.uuid);
  }

  resolveExtensionsManager() {

    this.singletonManager.registerSingleton({content_type: "SN|Component", package_info: {identifier: this.extensionsIdentifier}}, (resolvedSingleton) => {
      // Resolved Singleton
      this.systemExtensions.push(resolvedSingleton.uuid);

      var needsSync = false;
      if(isDesktopApplication()) {
        if(!resolvedSingleton.local_url) {
          resolvedSingleton.local_url = window._extensions_manager_location;
          needsSync = true;
        }
      } else {
        if(!resolvedSingleton.hosted_url) {
          resolvedSingleton.hosted_url = window._extensions_manager_location;
          needsSync = true;
        }
      }

      if(needsSync) {
        resolvedSingleton.setDirty(true);
        this.syncManager.sync("resolveExtensionsManager");
      }
    }, (valueCallback) => {
      // Safe to create. Create and return object.
      let url = window._extensions_manager_location;
      console.log("Installing Extensions Manager from URL", url);
      if(!url) {
        console.error("window._extensions_manager_location must be set.");
        return;
      }

      let packageInfo = {
        name: "Extensions",
        identifier: this.extensionsIdentifier
      }

      var item = {
        content_type: "SN|Component",
        content: {
          name: packageInfo.name,
          area: "rooms",
          package_info: packageInfo,
          permissions: [
            {
              name: "stream-items",
              content_types: ["SN|Component", "SN|Theme", "SF|Extension", "Extension", "SF|MFA", "SN|Editor"]
            }
          ]
        }
      }

      if(isDesktopApplication()) {
        item.content.local_url = window._extensions_manager_location;
      } else {
        item.content.hosted_url = window._extensions_manager_location;
      }

      var component = this.modelManager.createItem(item);
      this.modelManager.addItem(component);

      component.setDirty(true);
      this.syncManager.sync("resolveExtensionsManager createNew");

      this.systemExtensions.push(component.uuid);

      valueCallback(component);
    });
  }

}

angular.module('app').service('sysExtManager', SysExtManager);
