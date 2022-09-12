import { Environment } from '@standardnotes/models'
import { DeviceInterface, InternalEventBusInterface, EncryptionService } from '@standardnotes/services'

import { SNSessionManager } from '../Services/Session/SessionManager'
import { ApplicationIdentifier } from '@standardnotes/common'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { ChallengeService, SNSingletonManager, SNFeaturesService, DiskStorageService } from '@Lib/Services'

export type MigrationServices = {
  protocolService: EncryptionService
  deviceInterface: DeviceInterface
  storageService: DiskStorageService
  challengeService: ChallengeService
  sessionManager: SNSessionManager
  itemManager: ItemManager
  singletonManager: SNSingletonManager
  featuresService: SNFeaturesService
  environment: Environment
  identifier: ApplicationIdentifier
  internalEventBus: InternalEventBusInterface
}
