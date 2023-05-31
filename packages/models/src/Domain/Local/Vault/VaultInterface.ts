import { VaultServerHash } from '@standardnotes/responses'

export interface VaultInterface {
  uuid: string
  userUuid?: string
  specifiedItemsKeyUuid: string
  vaultKeyTimestamp: number
}

export function VaultInterfaceFromServerHash(serverHash: VaultServerHash): VaultInterface {
  return {
    uuid: serverHash.uuid,
    userUuid: serverHash.user_uuid,
    specifiedItemsKeyUuid: serverHash.specified_items_key_uuid,
    vaultKeyTimestamp: serverHash.vault_key_timestamp,
  }
}
