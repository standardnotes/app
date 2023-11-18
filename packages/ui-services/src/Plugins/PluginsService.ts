import {
  ComponentContent,
  ComponentContentSpecialized,
  ComponentInterface,
  FillItemContentSpecialized,
} from '@standardnotes/models'
import { PluginListing, PluginsList } from './PluginListing'
import { ContentType } from '@standardnotes/domain-core'
import { FindNativeFeature, GetFeatures, ThirdPartyFeatureDescription } from '@standardnotes/features'
import {
  API_MESSAGE_FAILED_DOWNLOADING_EXTENSION,
  AlertService,
  ItemManagerInterface,
  LegacyApiServiceInterface,
  MutatorClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { PluginsServiceInterface } from './PluginsServiceInterface'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { isString } from '@standardnotes/utils'

const PluginsUrl = 'https://raw.githubusercontent.com/standardnotes/plugins/main/cdn/dist/packages.json'

type DownloadedPackages = {
  [key: string]: PluginListing
}

export class PluginsService implements PluginsServiceInterface {
  private originalPlugins?: PluginsList

  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private api: LegacyApiServiceInterface,
    private alerts: AlertService,
    private crypto: PureCryptoInterface,
  ) {}

  private async performDownloadPlugins(): Promise<PluginsList> {
    const response = await fetch(PluginsUrl)
    const changelog = await response.text()
    const parsedData = JSON.parse(changelog) as DownloadedPackages

    return Object.values(parsedData)
  }

  public async getInstallablePlugins(): Promise<PluginsList> {
    if (this.originalPlugins) {
      return this.filterOutAlreadyInstalledPlugins(this.originalPlugins)
    }

    this.originalPlugins = await this.performDownloadPlugins()

    return this.filterOutAlreadyInstalledPlugins(this.originalPlugins)
  }

  private filterOutAlreadyInstalledPlugins(plugins: PluginsList): PluginsList {
    return plugins.filter((plugin) => {
      const isNativeFeature = !!FindNativeFeature(plugin.identifier)
      if (isNativeFeature) {
        return false
      }

      const existingInstalled = this.items.getDisplayableComponents().find((component) => {
        return component.identifier === plugin.identifier
      })

      return !existingInstalled
    })
  }

  public async installPlugin(
    plugin: PluginListing | ThirdPartyFeatureDescription,
  ): Promise<ComponentInterface | undefined> {
    const isValidContentType = [
      ContentType.TYPES.Component,
      ContentType.TYPES.Theme,
      ContentType.TYPES.ActionsExtension,
      ContentType.TYPES.ExtensionRepo,
    ].includes(plugin.content_type)

    if (!isValidContentType) {
      return
    }

    const nativeFeature = FindNativeFeature(plugin.identifier)
    if (nativeFeature && !nativeFeature.deprecated) {
      void this.alerts.alert('Unable to install plugin due to a conflict with a native feature.')
      return
    }

    if (plugin.url) {
      for (const nativeFeature of GetFeatures()) {
        if (plugin.url.includes(nativeFeature.identifier) && !nativeFeature.deprecated) {
          void this.alerts.alert('Unable to install plugin due to a conflict with a native feature.')
          return
        }
      }
    }

    const content = FillItemContentSpecialized<ComponentContentSpecialized, ComponentContent>({
      area: plugin.area,
      name: plugin.name ?? '',
      package_info: plugin,
      valid_until: new Date(plugin.expires_at || 0),
      hosted_url: plugin.url,
    })

    const component = this.items.createTemplateItem<ComponentContent, ComponentInterface>(plugin.content_type, content)

    await this.mutator.insertItem(component)
    void this.sync.sync()

    return component
  }

  public async installPluginFromUrl(urlOrCode: string): Promise<ComponentInterface | undefined> {
    let url = urlOrCode
    try {
      url = this.crypto.base64Decode(urlOrCode)
    } catch (err) {
      void err
    }

    const response = await this.api.downloadFeatureUrl(url)
    if (response.data?.error) {
      await this.alerts.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
      return undefined
    }

    let rawFeature = response.data as ThirdPartyFeatureDescription

    if (isString(rawFeature)) {
      try {
        rawFeature = JSON.parse(rawFeature)
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }

    if (!rawFeature.content_type) {
      return
    }

    const nativeFeature = FindNativeFeature(rawFeature.identifier)
    if (nativeFeature) {
      await this.alerts.alert('Unable to install external plugin due to a conflict with a native feature.')
      return
    }

    if (rawFeature.url) {
      for (const nativeFeature of GetFeatures()) {
        if (rawFeature.url.includes(nativeFeature.identifier)) {
          await this.alerts.alert('Unable to install external plugin due to a conflict with a native feature.')
          return
        }
      }
    }

    return this.installPlugin(rawFeature)
  }
}
