import { DecryptedItemInterface, DecryptedItemMutator, MutationType } from '../../Abstract/Item'
import { TagPreferences } from '../Tag/TagPreferences'
import { SmartViewContent } from './SmartViewContent'

export class SmartViewMutator extends DecryptedItemMutator<SmartViewContent> {
  private mutablePreferences?: TagPreferences

  constructor(item: DecryptedItemInterface<SmartViewContent>, type: MutationType) {
    super(item, type)

    this.mutablePreferences = this.mutableContent.preferences
  }

  set title(title: string) {
    this.mutableContent.title = title
  }

  set expanded(expanded: boolean) {
    this.mutableContent.expanded = expanded
  }

  set iconString(iconString: string) {
    this.mutableContent.iconString = iconString
  }

  set predicate(predicate: SmartViewContent['predicate']) {
    this.mutableContent.predicate = predicate
  }

  get preferences(): TagPreferences {
    if (!this.mutablePreferences) {
      this.mutableContent.preferences = {}
      this.mutablePreferences = this.mutableContent.preferences
    }

    return this.mutablePreferences
  }

  set preferences(preferences: TagPreferences | undefined) {
    this.mutablePreferences = preferences
    this.mutableContent.preferences = this.mutablePreferences
  }
}
