/* A class for handling installation of system extensions */

import { isDesktopApplication } from '@/utils';
import { SFPredicate } from 'snjs';

export class NativeExtManager {
  /* @ngInject */
  constructor(modelManager, syncManager, singletonManager) {
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.singletonManager = singletonManager;

    this.extManagerId = "org.standardnotes.extensions-manager";
    this.batchManagerId = "org.standardnotes.batch-manager";
    this.systemExtensions = [];

    this.resolveExtensionsManager();
    this.resolveBatchManager();
  }

  isSystemExtension(extension) {
    return this.systemExtensions.includes(extension.uuid);
  }

  resolveExtensionsManager() {

    let contentTypePredicate = new SFPredicate("content_type", "=", "SN|Component");
    let packagePredicate = new SFPredicate("package_info.identifier", "=", this.extManagerId);

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
      if(!url) {
        console.error("window._extensions_manager_location must be set.");
        return;
      }

      let packageInfo = {
        name: "Extensions",
        identifier: this.extManagerId
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
    let packagePredicate = new SFPredicate("package_info.identifier", "=", this.batchManagerId);

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
      if(!url) {
        console.error("window._batch_manager_location must be set.");
        return;
      }

      let packageInfo = {
        name: "Batch Manager",
        identifier: this.batchManagerId
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
