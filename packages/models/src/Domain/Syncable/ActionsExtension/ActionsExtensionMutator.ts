import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { ActionExtensionContent } from './ActionsExtension'
import { Action } from './Types'

export class ActionsExtensionMutator extends DecryptedItemMutator<ActionExtensionContent> {
  set description(description: string) {
    this.mutableContent.description = description
  }

  set supported_types(supported_types: string[]) {
    this.mutableContent.supported_types = supported_types
  }

  set actions(actions: Action[]) {
    this.mutableContent.actions = actions
  }

  set deprecation(deprecation: string | undefined) {
    this.mutableContent.deprecation = deprecation
  }
}
