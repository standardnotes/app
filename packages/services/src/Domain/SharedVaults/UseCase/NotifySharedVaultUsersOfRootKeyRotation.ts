import {
  AsymmetricMessageServerInterface,
  SharedVaultInvitesServerInterface,
  SharedVaultUsersServerInterface,
} from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ReuploadSharedVaultInvitesAfterKeyRotationUseCase } from './ReuploadSharedVaultInvitesAfterKeyRotation'
import { SendSharedVaultRootKeyChangedMessageToAll } from './SendSharedVaultRootKeyChangedMessageToAll'

export class NotifySharedVaultUsersOfRootKeyRotationUseCase {
  constructor(
    private sharedVaultUsersServer: SharedVaultUsersServerInterface,
    private sharedVaultInvitesServer: SharedVaultInvitesServerInterface,
    private messageServer: AsymmetricMessageServerInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(params: {
    sharedVault: SharedVaultListingInterface
    userUuid: string
  }): Promise<ClientDisplayableError[]> {
    const errors: ClientDisplayableError[] = []
    const updatePendingInvitesUseCase = new ReuploadSharedVaultInvitesAfterKeyRotationUseCase(
      this.encryption,
      this.contacts,
      this.sharedVaultInvitesServer,
      this.sharedVaultUsersServer,
    )

    const updateExistingResults = await updatePendingInvitesUseCase.execute({
      sharedVault: params.sharedVault,
      senderUuid: params.userUuid,
      senderEncryptionKeyPair: this.encryption.getKeyPair(),
      senderSigningKeyPair: this.encryption.getSigningKeyPair(),
    })

    errors.push(...updateExistingResults)

    const shareKeyUseCase = new SendSharedVaultRootKeyChangedMessageToAll(
      this.encryption,
      this.contacts,
      this.sharedVaultUsersServer,
      this.messageServer,
    )

    const shareKeyResults = await shareKeyUseCase.execute({
      keySystemIdentifier: params.sharedVault.systemIdentifier,
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      senderUuid: params.userUuid,
      senderEncryptionKeyPair: this.encryption.getKeyPair(),
      senderSigningKeyPair: this.encryption.getSigningKeyPair(),
    })

    errors.push(...shareKeyResults)

    return errors
  }
}
