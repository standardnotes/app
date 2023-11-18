import { ComponentInterface } from '@standardnotes/models'
import { PluginListing, PluginsList } from './PluginListing'

export interface PluginsServiceInterface {
  getPlugins(): Promise<PluginsList>
  installPlugin(plugin: PluginListing): ComponentInterface | undefined
  installPluginFromUrl(urlOrCode: string): Promise<ComponentInterface | undefined>
}
