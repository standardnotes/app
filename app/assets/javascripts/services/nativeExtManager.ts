import { isDesktopApplication } from '@/utils';
import {
  SNPredicate,
  ContentType,
  SNComponent,
  ApplicationService,
  ComponentAction,
  FillItemContent,
  ComponentMutator,
  Copy,
  dictToArray,
  PayloadContent,
  ComponentPermission
} from '@standardnotes/snjs';

/** A class for handling installation of system extensions */
export class NativeExtManager extends ApplicationService {
  extManagerId = 'org.standardnotes.extensions-manager';
  batchManagerId = 'org.standardnotes.batch-manager';

  /** @override */
  async onAppLaunch() {
    super.onAppLaunch();
    this.reload();
  }

  get extManagerPred() {
    const extManagerId = 'org.standardnotes.extensions-manager';
    return SNPredicate.CompoundPredicate([
      new SNPredicate('content_type', '=', ContentType.Component),
      new SNPredicate('package_info.identifier', '=', extManagerId)
    ]);
  }

  get batchManagerPred() {
    const batchMgrId = 'org.standardnotes.batch-manager';
    return SNPredicate.CompoundPredicate([
      new SNPredicate('content_type', '=', ContentType.Component),
      new SNPredicate('package_info.identifier', '=', batchMgrId)
    ]);
  }

  get extMgrUrl() {
    return (window as any)._extensions_manager_location;
  }

  get batchMgrUrl() {
    return (window as any)._batch_manager_location;
  }

  reload() {
    this.application!.singletonManager!.registerPredicate(this.extManagerPred);
    this.application!.singletonManager!.registerPredicate(this.batchManagerPred);
    this.resolveExtensionsManager();
    this.resolveBatchManager();
  }

  async resolveExtensionsManager() {
    const extensionsManager = (await this.application!.singletonManager!.findOrCreateSingleton(
      this.extManagerPred,
      ContentType.Component,
      this.extensionsManagerTemplateContent()
    )) as SNComponent;
    let needsSync = false;
    if (isDesktopApplication()) {
      if (!extensionsManager.local_url) {
        await this.application!.changeItem(extensionsManager.uuid, (m) => {
          const mutator = m as ComponentMutator;
          mutator.local_url = this.extMgrUrl;
        });
        needsSync = true;
      }
    } else {
      if (!extensionsManager.hosted_url) {
        await this.application!.changeItem(extensionsManager.uuid, (m) => {
          const mutator = m as ComponentMutator;
          mutator.hosted_url = this.extMgrUrl;
        });
        needsSync = true;
      }
    }
    // Handle addition of SN|ExtensionRepo permission
    const permissions = Copy(extensionsManager!.permissions) as ComponentPermission[];
    const permission = permissions.find((p) => {
      return p.name === ComponentAction.StreamItems
    });
    if (permission && !permission.content_types!.includes(ContentType.ExtensionRepo)) {
      permission.content_types!.push(ContentType.ExtensionRepo);
      await this.application!.changeItem(extensionsManager.uuid, (m) => {
        const mutator = m as ComponentMutator;
        mutator.permissions = permissions;
      });
      needsSync = true;
    }
    if (needsSync) {
      this.application!.saveItem(extensionsManager.uuid);
    }
  }

  extensionsManagerTemplateContent() {
    const url = this.extMgrUrl;
    if (!url) {
      throw Error('this.extMgrUrl must be set.');
    }
    const packageInfo = {
      name: 'Extensions',
      identifier: this.extManagerId
    };
    const content = FillItemContent({
      name: packageInfo.name,
      area: 'rooms',
      package_info: packageInfo,
      permissions: [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.Component,
            ContentType.Theme,
            ContentType.ServerExtension,
            ContentType.ActionsExtension,
            ContentType.Mfa,
            ContentType.Editor,
            ContentType.ExtensionRepo
          ]
        }
      ]
    }) as PayloadContent;
    if (isDesktopApplication()) {
      content.local_url = this.extMgrUrl;
    } else {
      content.hosted_url = this.extMgrUrl;
    }
    return content;
  }

  async resolveBatchManager() {
    const batchManager = (await this.application!.singletonManager!.findOrCreateSingleton(
      this.batchManagerPred,
      ContentType.Component,
      this.batchManagerTemplateContent()
    )) as SNComponent;
    let needsSync = false;
    if (isDesktopApplication()) {
      if (!batchManager.local_url) {
        await this.application!.changeItem(batchManager.uuid, (m) => {
          const mutator = m as ComponentMutator;
          mutator.local_url = this.batchMgrUrl;
        });
        needsSync = true;
      }
    } else {
      if (!batchManager.hosted_url) {
        await this.application!.changeItem(batchManager.uuid, (m) => {
          const mutator = m as ComponentMutator;
          mutator.hosted_url = this.batchMgrUrl;
        });
        needsSync = true;
      }
    }
    // Handle addition of SN|ExtensionRepo permission
    const permissions = Copy(batchManager!.permissions) as ComponentPermission[];
    const permission = permissions.find((p) => {
      return p.name === ComponentAction.StreamItems
    });
    if (permission && !permission.content_types!.includes(ContentType.ExtensionRepo)) {
      permission.content_types!.push(ContentType.ExtensionRepo);
      await this.application!.changeItem(batchManager.uuid, (m) => {
        const mutator = m as ComponentMutator;
        mutator.permissions = permissions;
      });
      needsSync = true;
    }
    if (needsSync) {
      this.application!.saveItem(batchManager.uuid);
    }
  }

  batchManagerTemplateContent() {
    const url = this.batchMgrUrl;
    if (!url) {
      throw Error('window._batch_manager_location must be set.');
    }
    const packageInfo = {
      name: 'Batch Manager',
      identifier: this.batchManagerId
    };
    const allContentType = dictToArray(ContentType);
    const content = FillItemContent({
      name: packageInfo.name,
      area: 'modal',
      package_info: packageInfo,
      permissions: [
        {
          name: ComponentAction.StreamItems,
          content_types: allContentType
        }
      ]
    });
    if (isDesktopApplication()) {
      content.local_url = this.batchMgrUrl;
    } else {
      content.hosted_url = this.batchMgrUrl;
    }
    return content;
  }
}
