import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemMutator } from '../../Abstract/Item'
import { GroupKeyContent } from './GroupKeyContent'

export class GroupKeyMutator extends DecryptedItemMutator<GroupKeyContent> {
  set groupKey(groupKey: string) {
    this.mutableContent.groupKey = groupKey
  }

  set keyVersion(keyVersion: ProtocolVersion) {
    this.mutableContent.keyVersion = keyVersion
  }
}
