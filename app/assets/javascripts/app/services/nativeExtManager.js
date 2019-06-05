/* A class for handling installation of system extensions */

class NativeExtManager {

  constructor(modelManager, syncManager, singletonManager) {
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.singletonManager = singletonManager;

    this.extensionsManagerIdentifier = "org.standardnotes.extensions-manager";
    this.batchManagerIdentifier = "org.standardnotes.batch-manager";
    this.systemExtensions = [];

    this.resolveExtensionsManager();
    this.resolveBatchManager();
  }

  isSystemExtension(extension) {
    return this.systemExtensions.includes(extension.uuid);
  }

  resolveExtensionsManager() {

    let contentTypePredicate = new SFPredicate("content_type", "=", "SN|Component");
    let packagePredicate = new SFPredicate("package_info.identifier", "=", this.extensionsManagerIdentifier);

    this.singletonManager.registerSingleton([contentTypePredicate, packagePredicate], (resolvedSingleton) => {
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

      // Handle addition of SN|ExtensionRepo permission
      let permission = resolvedSingleton.content.permissions.find((p) => p.name == "stream-items");
      if(!permission.content_types.includes("SN|ExtensionRepo")) {
        permission.content_types.push("SN|ExtensionRepo");
        needsSync = true;
      }

      if(needsSync) {
        this.modelManager.setItemDirty(resolvedSingleton, true);
        this.syncManager.sync();
      }
    }, (valueCallback) => {
      // Safe to create. Create and return object.
      let url = window._extensions_manager_location;
      // console.log("Installing Extensions Manager from URL", url);
      if(!url) {
        console.error("window._extensions_manager_location must be set.");
        return;
      }

      let packageInfo = {
        name: "Extensions",
        identifier: this.extensionsManagerIdentifier
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
              content_types: [
                "SN|Component", "SN|Theme", "SF|Extension",
                "Extension", "SF|MFA", "SN|Editor", "SN|ExtensionRepo"
              ]
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

      this.modelManager.setItemDirty(component, true);
      this.syncManager.sync();

      this.systemExtensions.push(component.uuid);

      valueCallback(component);
    });
  }

  resolveBatchManager() {

    let contentTypePredicate = new SFPredicate("content_type", "=", "SN|Component");
    let packagePredicate = new SFPredicate("package_info.identifier", "=", this.batchManagerIdentifier);

    this.singletonManager.registerSingleton([contentTypePredicate, packagePredicate], (resolvedSingleton) => {
      // Resolved Singleton
      this.systemExtensions.push(resolvedSingleton.uuid);

      var needsSync = false;
      if(isDesktopApplication()) {
        if(!resolvedSingleton.local_url) {
          resolvedSingleton.local_url = window._batch_manager_location;
          needsSync = true;
        }
      } else {
        if(!resolvedSingleton.hosted_url) {
          resolvedSingleton.hosted_url = window._batch_manager_location;
          needsSync = true;
        }
      }

      if(needsSync) {
        this.modelManager.setItemDirty(resolvedSingleton, true);
        this.syncManager.sync();
      }
    }, (valueCallback) => {
      // Safe to create. Create and return object.
      let url = window._batch_manager_location;
      // console.log("Installing Batch Manager from URL", url);
      if(!url) {
        console.error("window._batch_manager_location must be set.");
        return;
      }

      let packageInfo = {
        name: "Batch Manager",
        identifier: this.batchManagerIdentifier
      }

      var item = {
        content_type: "SN|Component",
        content: {
          name: packageInfo.name,
          area: "modal",
          package_info: packageInfo,
          permissions: [
            {
              name: "stream-items",
              content_types: [
                "Note", "Tag", "SN|SmartTag",
                "SN|Component", "SN|Theme", "SN|UserPreferences",
                "SF|Extension", "Extension", "SF|MFA", "SN|Editor",
                "SN|FileSafe|Credentials", "SN|FileSafe|FileMetadata", "SN|FileSafe|Integration"
              ]
            }
          ]
        }
      }

      if(isDesktopApplication()) {
        item.content.local_url = window._batch_manager_location;
      } else {
        item.content.hosted_url = window._batch_manager_location;
      }

      var component = this.modelManager.createItem(item);
      this.modelManager.addItem(component);

      this.modelManager.setItemDirty(component, true);
      this.syncManager.sync();

      this.systemExtensions.push(component.uuid);

      valueCallback(component);
    });
  }
}

angular.module('app').service('nativeExtManager', NativeExtManager);
