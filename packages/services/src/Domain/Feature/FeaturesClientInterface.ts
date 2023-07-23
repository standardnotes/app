import { FeatureIdentifier } from '@standardnotes/features'
import { ComponentInterface, DecryptedItemInterface } from '@standardnotes/models'

import { FeatureStatus } from './FeatureStatus'
import { SetOfflineFeaturesFunctionResponse } from './SetOfflineFeaturesFunctionResponse'

export interface FeaturesClientInterface {
  initializeFromDisk(): void
  getFeatureStatus(featureId: FeatureIdentifier, options?: { inContextOfItem?: DecryptedItemInterface }): FeatureStatus
  hasMinimumRole(role: string): boolean

  hasFirstPartyOfflineSubscription(): boolean
  setOfflineFeaturesCode(code: string): Promise<SetOfflineFeaturesFunctionResponse>
  hasOfflineRepo(): boolean
  deleteOfflineFeatureRepo(): Promise<void>

  isThirdPartyFeature(identifier: string): boolean

  toggleExperimentalFeature(identifier: FeatureIdentifier): void
  getExperimentalFeatures(): FeatureIdentifier[]
  getEnabledExperimentalFeatures(): FeatureIdentifier[]
  enableExperimentalFeature(identifier: FeatureIdentifier): void
  disableExperimentalFeature(identifier: FeatureIdentifier): void
  isExperimentalFeatureEnabled(identifier: FeatureIdentifier): boolean
  isExperimentalFeature(identifier: FeatureIdentifier): boolean

  downloadRemoteThirdPartyFeature(urlOrCode: string): Promise<ComponentInterface | undefined>
}
