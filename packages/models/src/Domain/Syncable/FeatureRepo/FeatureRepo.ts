import { useBoolean } from '@standardnotes/utils'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export interface FeatureRepoContent extends ItemContent {
  migratedToUserSetting?: boolean
  migratedToOfflineEntitlements?: boolean
  offlineFeaturesUrl?: string
  offlineKey?: string
  url?: string
}

export class SNFeatureRepo extends DecryptedItem<FeatureRepoContent> {
  public get migratedToUserSetting(): boolean {
    return useBoolean(this.payload.content.migratedToUserSetting, false)
  }

  public get migratedToOfflineEntitlements(): boolean {
    return useBoolean(this.payload.content.migratedToOfflineEntitlements, false)
  }

  public get onlineUrl(): string | undefined {
    return this.payload.content.url
  }

  get offlineFeaturesUrl(): string | undefined {
    return this.payload.content.offlineFeaturesUrl
  }

  get offlineKey(): string | undefined {
    return this.payload.content.offlineKey
  }
}
