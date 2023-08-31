import { DecryptedItemInterface, TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultInviteServerHash, SharedVaultUserServerHash } from '@standardnotes/responses'
import { ItemSignatureValidationResult } from './UseCase/Types/ItemSignatureValidationResult'
import { Result } from '@standardnotes/domain-core'

export enum ContactServiceEvent {}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  isCollaborationEnabled(): boolean
  enableCollaboration(): Promise<void>
  getCollaborationID(): string
  getCollaborationIDFromInvite(invite: SharedVaultInviteServerHash): string
  addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined>
  getCollaborationIDForTrustedContact(contact: TrustedContactInterface): string

  createOrEditTrustedContact(params: {
    contactUuid: string
    name?: string
    publicKey: string
    signingPublicKey: string
  }): Promise<TrustedContactInterface | undefined>
  editTrustedContactFromCollaborationID(
    contact: TrustedContactInterface,
    params: { name: string; collaborationID: string },
  ): Promise<TrustedContactInterface>
  deleteContact(contact: TrustedContactInterface): Promise<Result<void>>

  getAllContacts(): TrustedContactInterface[]
  getSelfContact(): TrustedContactInterface | undefined
  findContact(userUuid: string): TrustedContactInterface | undefined
  findContactForServerUser(user: SharedVaultUserServerHash): TrustedContactInterface | undefined
  findContactForInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined
  findSenderContactForInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined

  getItemSignatureStatus(item: DecryptedItemInterface): ItemSignatureValidationResult
}
