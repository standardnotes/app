import { DecryptedItemMutator } from '../../Abstract/Item'
import { GroupKeyContent } from './GroupKeyContent'

export class GroupKeyMutator extends DecryptedItemMutator<GroupKeyContent> {
  set groupKey(groupKey: string) {
    this.mutableContent.groupKey = groupKey
  }
}
