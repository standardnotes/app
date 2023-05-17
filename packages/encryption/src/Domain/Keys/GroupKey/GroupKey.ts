import { ProtocolVersion } from '@standardnotes/common'
import { GroupKeyInterface } from './GroupKeyInterface'

export function isGroupKey(item: unknown): item is GroupKeyInterface {
  return item instanceof GroupKey
}

export class GroupKey implements GroupKeyInterface {
  uuid: string
  groupUuid: string
  key: string
  updatedAtTimestamp: number
  senderPublicKey: string
  keyVersion: ProtocolVersion

  constructor(dto: Omit<GroupKeyInterface, 'itemsKey'>) {
    this.uuid = dto.uuid
    this.groupUuid = dto.groupUuid
    this.key = dto.key
    this.updatedAtTimestamp = dto.updatedAtTimestamp
    this.keyVersion = dto.keyVersion
    this.senderPublicKey = dto.senderPublicKey
  }

  get itemsKey(): string {
    return this.key
  }
}
