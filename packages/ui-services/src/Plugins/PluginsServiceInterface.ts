import { ComponentInterface } from '@standardnotes/models'
import { PluginListing, PluginsList } from './PluginListing'

export interface PluginsServiceInterface {
  getInstallablePlugins(): Promise<PluginsList>
  installPlugin(plugin: PluginListing): Promise<ComponentInterface | undefined>
  installPluginFromUrl(urlOrCode: string): Promise<ComponentInterface | undefined>
}
