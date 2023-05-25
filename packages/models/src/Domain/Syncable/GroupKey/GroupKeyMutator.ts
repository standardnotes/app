import { DecryptedItemMutator } from '../../Abstract/Item'
import { GroupKeyContent, GroupKeyContentSpecialized } from './GroupKeyContent'
import { Copy } from '@standardnotes/utils'

export class GroupKeyMutator extends DecryptedItemMutator<GroupKeyContent> {
  set content(content: GroupKeyContentSpecialized) {
    this.mutableContent = {
      ...this.mutableContent,
      ...Copy(content),
    }
  }

  set groupName(groupName: string) {
    this.mutableContent.groupName = groupName
  }

  set groupDescription(groupDescription: string | undefined) {
    this.mutableContent.groupDescription = groupDescription
  }
}
