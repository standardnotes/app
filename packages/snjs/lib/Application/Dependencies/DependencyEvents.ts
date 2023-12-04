import {
  AccountEvent,
  ApiServiceEvent,
  ApplicationEvent,
  IntegrityEvent,
  InternalEventBusInterface,
  NotificationServiceEvent,
  SessionEvent,
  SyncEvent,
  WebSocketsServiceEvent,
} from '@standardnotes/services'
import { Dependencies } from './Dependencies'
import { TYPES } from './Types'

export function RegisterApplicationServicesEvents(container: Dependencies, events: InternalEventBusInterface): void {
  events.addEventHandler(container.get(TYPES.AsymmetricMessageService), SyncEvent.ReceivedAsymmetricMessages)
  events.addEventHandler(container.get(TYPES.AsymmetricMessageService), WebSocketsServiceEvent.MessageSentToUser)
  events.addEventHandler(container.get(TYPES.DiskStorageService), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.FeaturesService), ApiServiceEvent.MetaReceived)
  events.addEventHandler(container.get(TYPES.FeaturesService), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.IntegrityService), SyncEvent.SyncRequestsIntegrityCheck)
  events.addEventHandler(container.get(TYPES.KeyRecoveryService), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.KeySystemKeyManager), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.MigrationService), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.NotificationService), SyncEvent.ReceivedNotifications)
  events.addEventHandler(container.get(TYPES.NotificationService), WebSocketsServiceEvent.NotificationAddedForUser)
  events.addEventHandler(container.get(TYPES.PreferencesService), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.ProtectionService), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.ProtectionService), ApplicationEvent.Started)
  events.addEventHandler(container.get(TYPES.SelfContactManager), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.SessionManager), ApiServiceEvent.SessionRefreshed)
  events.addEventHandler(container.get(TYPES.SessionManager), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.SharedVaultService), NotificationServiceEvent.NotificationReceived)
  events.addEventHandler(container.get(TYPES.VaultInviteService), NotificationServiceEvent.NotificationReceived)
  events.addEventHandler(container.get(TYPES.SharedVaultService), SessionEvent.UserKeyPairChanged)
  events.addEventHandler(container.get(TYPES.SharedVaultService), SyncEvent.ReceivedRemoteSharedVaults)
  events.addEventHandler(container.get(TYPES.SubscriptionManager), ApplicationEvent.ApplicationStageChanged)
  events.addEventHandler(container.get(TYPES.SubscriptionManager), ApplicationEvent.Launched)
  events.addEventHandler(container.get(TYPES.SubscriptionManager), ApplicationEvent.SignedIn)
  events.addEventHandler(container.get(TYPES.SubscriptionManager), ApplicationEvent.UserRolesChanged)
  events.addEventHandler(container.get(TYPES.SubscriptionManager), SessionEvent.Restored)
  events.addEventHandler(container.get(TYPES.SyncService), IntegrityEvent.IntegrityCheckCompleted)
  events.addEventHandler(container.get(TYPES.SyncService), WebSocketsServiceEvent.ItemsChangedOnServer)
  events.addEventHandler(container.get(TYPES.UserService), AccountEvent.SignedInOrRegistered)
  events.addEventHandler(container.get(TYPES.VaultInviteService), ApplicationEvent.Launched)
  events.addEventHandler(container.get(TYPES.VaultInviteService), SyncEvent.ReceivedSharedVaultInvites)
  events.addEventHandler(container.get(TYPES.VaultInviteService), WebSocketsServiceEvent.UserInvitedToSharedVault)

  if (container.get(TYPES.FilesBackupService)) {
    events.addEventHandler(container.get(TYPES.FilesBackupService), ApplicationEvent.ApplicationStageChanged)
  }
  if (container.get(TYPES.HomeServerService)) {
    events.addEventHandler(container.get(TYPES.HomeServerService), ApplicationEvent.ApplicationStageChanged)
  }
}
