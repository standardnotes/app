import { ServerItemResponse } from '@standardnotes/responses'
import { EncryptionProviderInterface, RevisionClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Uuid } from '@standardnotes/domain-core'
import {
  EncryptedPayload,
  HistoryEntry,
  isErrorDecryptingPayload,
  checkRemotePayloadAllowed,
  NoteContent,
  PayloadTimestampDefaults,
} from '@standardnotes/models'

import { GetRevisionDTO } from './GetRevisionDTO'

export class GetRevision implements UseCaseInterface<HistoryEntry> {
  constructor(
    private revisionManager: RevisionClientInterface,
    private encryptionService: EncryptionProviderInterface,
  ) {}

  async execute(dto: GetRevisionDTO): Promise<Result<HistoryEntry>> {
    const itemUuidOrError = Uuid.create(dto.itemUuid)
    if (itemUuidOrError.isFailed()) {
      return Result.fail(`Could not get revision: ${itemUuidOrError.getError()}`)
    }
    const itemUuid = itemUuidOrError.getValue()

    const revisionUuidOrError = Uuid.create(dto.revisionUuid)
    if (revisionUuidOrError.isFailed()) {
      return Result.fail(`Could not get revision: ${revisionUuidOrError.getError()}`)
    }
    const revisionUuid = revisionUuidOrError.getValue()

    let revision
    try {
      revision = await this.revisionManager.getRevision(itemUuid, revisionUuid)
    } catch (error) {
      return Result.fail(`Could not get revision: ${(error as Error).message}`)
    }

    if (!revision) {
      return Result.fail('Could not get revision: Revision not found')
    }

    const serverPayload = new EncryptedPayload({
      ...PayloadTimestampDefaults(),
      uuid: revision.uuid,
      content: revision.content as string,
      enc_item_key: revision.enc_item_key as string,
      items_key_id: revision.items_key_id as string,
      auth_hash: revision.auth_hash as string,
      content_type: revision.content_type,
      updated_at: new Date(revision.updated_at),
      created_at: new Date(revision.created_at),
      key_system_identifier: revision.key_system_identifier ?? undefined,
      shared_vault_uuid: revision.shared_vault_uuid ?? undefined,
      waitingForKey: false,
      errorDecrypting: false,
    })

    /**
     * When an item is duplicated, its revisions also carry over to the newly created item.
     * However since the new item has a different UUID than the source item, we must decrypt
     * these olders revisions (which have not been mutated after copy) with the source item's
     * uuid.
     */
    const embeddedParams = this.encryptionService.getEmbeddedPayloadAuthenticatedData(serverPayload)
    const sourceItemUuid = embeddedParams?.u as string | undefined

    const payload = serverPayload.copy({
      uuid: sourceItemUuid || revision.item_uuid,
    })

    const remotePayloadAllowedResult = checkRemotePayloadAllowed(payload as ServerItemResponse)
    if (remotePayloadAllowedResult.disallowed !== undefined) {
      return Result.fail(`Remote payload is disallowed: ${JSON.stringify(payload)}`)
    }

    const encryptedPayload = new EncryptedPayload(payload)

    const decryptedPayload = await this.encryptionService.decryptSplitSingle<NoteContent>({
      usesItemsKeyWithKeyLookup: { items: [encryptedPayload] },
    })

    if (isErrorDecryptingPayload(decryptedPayload)) {
      return Result.fail('Could not decrypt revision.')
    }

    return Result.ok(new HistoryEntry(decryptedPayload))
  }
}
