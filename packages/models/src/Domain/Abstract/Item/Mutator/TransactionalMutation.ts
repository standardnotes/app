import { Uuid } from '@standardnotes/common'

import { MutationType } from '../Types/MutationType'

import { ItemMutator } from './ItemMutator'

export type TransactionalMutation = {
  itemUuid: Uuid
  mutate: (mutator: ItemMutator) => void
  mutationType?: MutationType
}
