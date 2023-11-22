import { DecryptedItemInterface } from '@standardnotes/models'
import { NativeFeatureIdentifier } from '@standardnotes/features'
import { RoleName, Uuid } from '@standardnotes/domain-core'
import { ClientDisplayableError } from '@standardnotes/responses'

import { FeatureStatus } from './FeatureStatus'
import { SetOfflineFeaturesFunctionResponse } from './SetOfflineFeaturesFunctionResponse'
import { OfflineSubscriptionEntitlements } from './OfflineSubscriptionEntitlements'

export interface FeaturesClientInterface {
  getFeatureStatus(
    featureId: NativeFeatureIdentifier | Uuid,
    options?: { inContextOfItem?: DecryptedItemInterface },
  ): FeatureStatus
  hasMinimumRole(role: string): boolean
  hasRole(roleName: RoleName): boolean
  hasFirstPartyOfflineSubscription(): boolean
  parseOfflineEntitlementsCode(code: string): OfflineSubscriptionEntitlements | ClientDisplayableError
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
}
