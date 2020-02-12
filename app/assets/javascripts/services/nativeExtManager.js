import { isDesktopApplication, dictToArray } from '@/utils';
import {
  ApplicationEvents,
  SFPredicate,
  ContentTypes,
  CreateMaxPayloadFromAnyObject
} from 'snjs';

const STREAM_ITEMS_PERMISSION = 'stream-items';

/** A class for handling installation of system extensions */
export class NativeExtManager {
  /* @ngInject */
  constructor(application) {
    this.application = application;
    this.extManagerId = 'org.standardnotes.extensions-manager';
    this.batchManagerId = 'org.standardnotes.batch-manager';

    this.unsub = application.addSingleEventObserver(ApplicationEvents.Launched, () => {
      this.reload();
      this.streamChanges();
    });
  }

  isSystemExtension(extension) {
    return this.nativeExtIds.includes(extension.uuid);
  }

  streamChanges() {
    this.application.streamItems({
      contentType: ContentTypes.Component,
      stream: () => {
        this.reload();
      }
    });
  }

  reload() {
    this.nativeExtIds = [];
    // this.resolveExtensionsManager();
    // this.resolveBatchManager();
  }

  extensionsManagerTemplatePayload() {
    const url = window._extensions_manager_location;
    if (!url) {
      console.error('window._extensions_manager_location must be set.');
      return;
    }
    const packageInfo = {
      name: 'Extensions',
      identifier: this.extManagerId
    };
    const content = {
      name: packageInfo.name,
      area: 'rooms',
      package_info: packageInfo,
      permissions: [
        {
          name: STREAM_ITEMS_PERMISSION,
          content_types: [
            ContentTypes.Component,
            ContentTypes.Theme,
            ContentTypes.ServerExtension,
            ContentTypes.ActionsExtension,
            ContentTypes.Mfa,
            ContentTypes.Editor,
            ContentTypes.ExtensionRepo
          ]
        }
      ]
    };
    if (isDesktopApplication()) {
      content.local_url = window._extensions_manager_location;
    } else {
      content.hosted_url = window._extensions_manager_location;
    }
    const payload = CreateMaxPayloadFromAnyObject({
      object: {
        content_type: ContentTypes.Component,
        content: content
      }
    });
    return payload;
  }

  async resolveExtensionsManager() {
    const contentTypePredicate = new SFPredicate('content_type', '=', ContentTypes.Component);
    const packagePredicate = new SFPredicate('package_info.identifier', '=', this.extManagerId);
    const predicate = SFPredicate.CompoundPredicate([contentTypePredicate, packagePredicate]);
    const extensionsManager = await this.application.singletonManager.findOrCreateSingleton({
      predicate: predicate,
      createPayload: this.extensionsManagerTemplatePayload()
    });
    this.nativeExtIds.push(extensionsManager.uuid);
    let needsSync = false;
    if (isDesktopApplication()) {
      if (!extensionsManager.local_url) {
        extensionsManager.local_url = window._extensions_manager_location;
        needsSync = true;
      }
    } else {
      if (!extensionsManager.hosted_url) {
        extensionsManager.hosted_url = window._extensions_manager_location;
        needsSync = true;
      }
    }
    // Handle addition of SN|ExtensionRepo permission
    const permission = extensionsManager.content.permissions.find((p) => p.name === STREAM_ITEMS_PERMISSION);
    if (!permission.content_types.includes(ContentTypes.ExtensionRepo)) {
      permission.content_types.push(ContentTypes.ExtensionRepo);
      needsSync = true;
    }
    if (needsSync) {
      this.application.saveItem({ item: extensionsManager });
    }
  }

  batchManagerTemplatePayload() {
    const url = window._batch_manager_location;
    if (!url) {
      console.error('window._batch_manager_location must be set.');
      return;
    }
    const packageInfo = {
      name: 'Batch Manager',
      identifier: this.batchManagerId
    };
    const allContentTypes = dictToArray(ContentTypes);
    const content = {
      name: packageInfo.name,
      area: 'modal',
      package_info: packageInfo,
      permissions: [
        {
          name: STREAM_ITEMS_PERMISSION,
          content_types: allContentTypes
        }
      ]
    };
    if (isDesktopApplication()) {
      content.local_url = window._batch_manager_location;
    } else {
      content.hosted_url = window._batch_manager_location;
    }
    const payload = CreateMaxPayloadFromAnyObject({
      object: {
        content_type: ContentTypes.Component,
        content: content
      }
    });
    return payload;
  }

  async resolveBatchManager() {
    const contentTypePredicate = new SFPredicate('content_type', '=', ContentTypes.Component);
    const packagePredicate = new SFPredicate('package_info.identifier', '=', this.batchManagerId);
    const predicate = SFPredicate.CompoundPredicate([contentTypePredicate, packagePredicate]);
    const batchManager = await this.application.singletonManager.findOrCreateSingleton({
      predicate: predicate,
      createPayload: this.batchManagerTemplatePayload()
    });
    this.nativeExtIds.push(batchManager.uuid);
    let needsSync = false;
    if (isDesktopApplication()) {
      if (!batchManager.local_url) {
        batchManager.local_url = window._batch_manager_location;
        needsSync = true;
      }
    } else {
      if (!batchManager.hosted_url) {
        batchManager.hosted_url = window._batch_manager_location;
        needsSync = true;
      }
    }
    // Handle addition of SN|ExtensionRepo permission
    const permission = batchManager.content.permissions.find((p) => p.name === STREAM_ITEMS_PERMISSION);
    if (!permission.content_types.includes(ContentTypes.ExtensionRepo)) {
      permission.content_types.push(ContentTypes.ExtensionRepo);
      needsSync = true;
    }
    if (needsSync) {
      this.application.saveItem({ item: batchManager });
    }

  }
}
