import { ComponentInterface } from '@standardnotes/models'
import { PluginListing, PluginsList } from './PluginListing'
import { ThirdPartyFeatureDescription } from '@standardnotes/features'

export interface PluginsServiceInterface {
  getInstallablePlugins(): Promise<PluginsList>
  installPlugin(plugin: PluginListing): Promise<ComponentInterface | undefined>
  getPluginDetailsFromUrl(urlOrCode: string): Promise<ThirdPartyFeatureDescription | undefined>
  installExternalPlugin(plugin: PluginListing | ThirdPartyFeatureDescription): Promise<ComponentInterface | undefined>
}
