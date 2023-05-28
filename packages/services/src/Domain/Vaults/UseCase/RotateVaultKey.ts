import { UuidGenerator } from '@standardnotes/utils'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, VaultServerHash, isClientDisplayableError } from '@standardnotes/responses'
import { VaultInvitesServerInterface, VaultUsersServerInterface, VaultsServerInterface } from '@standardnotes/api'
import { UpdateVaultUseCase } from './UpdateVault'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { VaultStorageServiceInterface } from '../VaultStorageServiceInterface'
import { ChangeVaultKeyDataUseCase } from './ChangeVaultKeyData'

export class RotateVaultKeyUseCase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private vaultsServer: VaultsServerInterface,
    private vaultInvitesServer: VaultInvitesServerInterface,
    private vaultUsersServer: VaultUsersServerInterface,
    private contacts: ContactServiceInterface,
    private vaultStorage: VaultStorageServiceInterface,
  ) {}

  async execute(params: {
    vaultUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<undefined | ClientDisplayableError[]> {
    const vaultKey = this.encryption.getVaultKey(params.vaultUuid)
    if (!vaultKey) {
      throw new Error('Cannot rotate vault key; vault key not found')
    }

    const newVaultContent = this.encryption.createVaultKeyData(params.vaultUuid)

    const errors: ClientDisplayableError[] = []

    const updateVaultVaultItemsKeyResult = await this.createNewVaultItemsKey({
      vaultUuid: params.vaultUuid,
      vaultKeyTimestamp: newVaultContent.keyTimestamp,
    })

    if (isClientDisplayableError(updateVaultVaultItemsKeyResult)) {
      errors.push(updateVaultVaultItemsKeyResult)
    }

    await this.encryption.reencryptVaultItemsKeysForVault(params.vaultUuid)

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

  private async createNewVaultItemsKey(params: {
    vaultUuid: string
    vaultKeyTimestamp: number
  }): Promise<ClientDisplayableError | VaultServerHash> {
    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = this.encryption.createVaultItemsKey(newItemsKeyUuid, params.vaultUuid)
    await this.items.insertItem(newItemsKey)

    const updateVaultUseCase = new UpdateVaultUseCase(this.vaultsServer)
    const updateResult = await updateVaultUseCase.execute({
      vaultUuid: params.vaultUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
      specifiedItemsKeyUuid: newItemsKey.uuid,
    })

    if (isClientDisplayableError(updateResult)) {
      return updateResult
    }

    this.vaultStorage.setVault(updateResult)

    return updateResult
  }
}
