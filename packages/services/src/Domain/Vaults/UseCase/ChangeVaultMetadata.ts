import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError } from '@standardnotes/responses'
import { VaultInvitesServerInterface, VaultUsersServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ChangeVaultKeyDataUseCase } from './ChangeVaultKeyData'
import { VaultKeyContentSpecialized } from '@standardnotes/models'

export class ChangeVaultMetadataUsecase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: VaultInvitesServerInterface,
    private vaultUsersServer: VaultUsersServerInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(params: {
    vaultUuid: string
    vaultName: string
    vaultDescription?: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<undefined | ClientDisplayableError[]> {
    const vaultKey = this.encryption.getVaultKey(params.vaultUuid)
    if (!vaultKey) {
      throw new Error('Cannot change vault metadata; vault key not found')
    }

    const newVaultContent: VaultKeyContentSpecialized = {
      ...vaultKey.content,
      vaultName: params.vaultName,
      vaultDescription: params.vaultDescription,
    }

    const errors: ClientDisplayableError[] = []

    const changeVaultDataUseCase = new ChangeVaultKeyDataUseCase(
      this.items,
      this.encryption,
      this.vaultInvitesServer,
      this.vaultUsersServer,
      this.contacts,
    )

    const changeVaultDataErrors = await changeVaultDataUseCase.execute({
      vaultUuid: params.vaultUuid,
      newVaultData: newVaultContent,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })

    errors.push(...changeVaultDataErrors)

    return errors
  }
}
