import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { FeatureRepoContent } from './FeatureRepo'

export class FeatureRepoMutator extends DecryptedItemMutator<FeatureRepoContent> {
  set migratedToUserSetting(migratedToUserSetting: boolean) {
    this.mutableContent.migratedToUserSetting = migratedToUserSetting
  }

  set migratedToOfflineEntitlements(migratedToOfflineEntitlements: boolean) {
    this.mutableContent.migratedToOfflineEntitlements = migratedToOfflineEntitlements
  }

  set offlineFeaturesUrl(offlineFeaturesUrl: string) {
    this.mutableContent.offlineFeaturesUrl = offlineFeaturesUrl
  }

  set offlineKey(offlineKey: string) {
    this.mutableContent.offlineKey = offlineKey
  }
}
