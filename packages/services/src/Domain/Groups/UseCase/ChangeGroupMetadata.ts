import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError } from '@standardnotes/responses'
import { GroupInvitesServerInterface, GroupUsersServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ChangeGroupKeyDataUseCase } from './ChangeGroupKeyData'
import { GroupKeyContentSpecialized } from '@standardnotes/models'

export class ChangeGroupMetadataUsecase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private groupInvitesServer: GroupInvitesServerInterface,
    private groupUsersServer: GroupUsersServerInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(params: {
    groupUuid: string
    groupName: string
    groupDescription?: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<undefined | ClientDisplayableError[]> {
    const groupKey = this.encryption.getGroupKey(params.groupUuid)
    if (!groupKey) {
      throw new Error('Cannot change group metadata; group key not found')
    }

    const newGroupContent: GroupKeyContentSpecialized = {
      ...groupKey.content,
      groupName: params.groupName,
      groupDescription: params.groupDescription,
    }

    const errors: ClientDisplayableError[] = []

    const changeGroupDataUseCase = new ChangeGroupKeyDataUseCase(
      this.items,
      this.encryption,
      this.groupInvitesServer,
      this.groupUsersServer,
      this.contacts,
    )

    const changeGroupDataErrors = await changeGroupDataUseCase.execute({
      groupUuid: params.groupUuid,
      newGroupData: newGroupContent,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })

    errors.push(...changeGroupDataErrors)

    return errors
  }
}
