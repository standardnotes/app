import { ComponentInterface, DecryptedItemInterface } from '@standardnotes/models'

import { FeatureStatus } from './FeatureStatus'
import { SetOfflineFeaturesFunctionResponse } from './SetOfflineFeaturesFunctionResponse'
import { NativeFeatureIdentifier } from '@standardnotes/features'
import { Uuid } from '@standardnotes/domain-core'

export interface FeaturesClientInterface {
  initializeFromDisk(): void
  getFeatureStatus(
    featureId: NativeFeatureIdentifier | Uuid,
    options?: { inContextOfItem?: DecryptedItemInterface },
  ): FeatureStatus
  hasMinimumRole(role: string): boolean

  hasFirstPartyOfflineSubscription(): boolean
  setOfflineFeaturesCode(code: string): Promise<SetOfflineFeaturesFunctionResponse>
  hasOfflineRepo(): boolean
  deleteOfflineFeatureRepo(): Promise<void>

  isThirdPartyFeature(identifier: string): boolean

  toggleExperimentalFeature(identifier: string): void
  getExperimentalFeatures(): string[]
  getEnabledExperimentalFeatures(): string[]
  enableExperimentalFeature(identifier: string): void
  disableExperimentalFeature(identifier: string): void
  isExperimentalFeatureEnabled(identifier: string): boolean
  isExperimentalFeature(identifier: string): boolean

  downloadRemoteThirdPartyFeature(urlOrCode: string): Promise<ComponentInterface | undefined>
}
