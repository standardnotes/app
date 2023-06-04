import { UserEventType } from './UserEventType'

export type UserEventPayload =
  | {
      eventType: UserEventType.SharedVaultItemRemoved
      itemUuid: string
      sharedVaultUuid: string
      version: string
    }
  | {
      eventType: UserEventType.RemovedFromSharedVault
      sharedVaultUuid: string
      version: string
    }
