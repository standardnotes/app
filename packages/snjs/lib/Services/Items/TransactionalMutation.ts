import * as Models from '@standardnotes/models'
import { UuidString } from '../../Types/UuidString'

export type TransactionalMutation = {
  itemUuid: UuidString
  mutate: (mutator: Models.ItemMutator) => void
  mutationType?: Models.MutationType
}
