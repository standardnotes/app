import { DecryptedItemMutator } from '../../Abstract/Item'
import { GroupKeyContent, GroupKeyContentSpecialized } from './GroupKeyContent'

export class GroupKeyMutator extends DecryptedItemMutator<GroupKeyContent> {
  set content(content: GroupKeyContentSpecialized) {
    this.mutableContent = {
      ...this.mutableContent,
      ...content,
    }
  }
}
