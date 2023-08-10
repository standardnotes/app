import { BackupServiceInterface } from '@standardnotes/files'
import { Environment, Platform, ApplicationIdentifier } from '@standardnotes/models'
import {
  DeviceInterface,
  InternalEventBusInterface,
  EncryptionService,
  MutatorClientInterface,
  PreferenceServiceInterface,
} from '@standardnotes/services'
import { SessionManager } from '../Services/Session/SessionManager'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { ChallengeService, SingletonManager, FeaturesService, DiskStorageService } from '@Lib/Services'
import { LegacySession, MapperInterface } from '@standardnotes/domain-core'

export type MigrationServices = {
  encryptionService: EncryptionService
  deviceInterface: DeviceInterface
  storageService: DiskStorageService
  challengeService: ChallengeService
  sessionManager: SessionManager
  backups?: BackupServiceInterface
  itemManager: ItemManager
  mutator: MutatorClientInterface
  singletonManager: SingletonManager
  featuresService: FeaturesService
  preferences: PreferenceServiceInterface
  environment: Environment
  platform: Platform
  identifier: ApplicationIdentifier
  legacySessionStorageMapper: MapperInterface<LegacySession, Record<string, unknown>>
  internalEventBus: InternalEventBusInterface
}
