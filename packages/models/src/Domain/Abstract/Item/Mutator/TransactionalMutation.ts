import { MutationType } from '../Types/MutationType'

import { ItemMutator } from './ItemMutator'

export type TransactionalMutation = {
  itemUuid: string
  mutate: (mutator: ItemMutator) => void
  mutationType?: MutationType
}
