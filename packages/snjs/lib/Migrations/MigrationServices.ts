import { BackupServiceInterface } from '@standardnotes/files'
import { Environment, Platform } from '@standardnotes/models'
import {
  DeviceInterface,
  InternalEventBusInterface,
  EncryptionService,
  MutatorClientInterface,
  PreferenceServiceInterface,
} from '@standardnotes/services'
import { SNSessionManager } from '../Services/Session/SessionManager'
import { ApplicationIdentifier } from '@standardnotes/common'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { ChallengeService, SNSingletonManager, SNFeaturesService, DiskStorageService } from '@Lib/Services'
import { LegacySession, MapperInterface } from '@standardnotes/domain-core'

export type MigrationServices = {
  encryptionService: EncryptionService
  deviceInterface: DeviceInterface
  storageService: DiskStorageService
  challengeService: ChallengeService
  sessionManager: SNSessionManager
  backups?: BackupServiceInterface
  itemManager: ItemManager
  mutator: MutatorClientInterface
  singletonManager: SNSingletonManager
  featuresService: SNFeaturesService
  preferences: PreferenceServiceInterface
  environment: Environment
  platform: Platform
  identifier: ApplicationIdentifier
  legacySessionStorageMapper: MapperInterface<LegacySession, Record<string, unknown>>
  internalEventBus: InternalEventBusInterface
}
