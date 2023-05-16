import { ProtocolVersion } from '@standardnotes/common'

export interface GroupKeyInterface {
  uuid: string
  groupUuid: string
  key: string
  keyVersion: ProtocolVersion
  senderPublicKey: string
  updatedAtTimestamp: number

  get itemsKey(): string
}
