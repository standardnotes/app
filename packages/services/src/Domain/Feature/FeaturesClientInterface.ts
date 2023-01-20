import { FeatureIdentifier } from '@standardnotes/features'
import { SNComponent } from '@standardnotes/models'

import { FeatureStatus } from './FeatureStatus'
import { SetOfflineFeaturesFunctionResponse } from './SetOfflineFeaturesFunctionResponse'

export interface FeaturesClientInterface {
  downloadExternalFeature(urlOrCode: string): Promise<SNComponent | undefined>

  getFeatureStatus(featureId: FeatureIdentifier): FeatureStatus

  hasFirstPartySubscription(): boolean

  hasMinimumRole(role: string): boolean

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
}
