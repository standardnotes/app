import { SNNote, ComponentMutator, TransactionalMutation, ItemMutator, ComponentInterface } from '@standardnotes/snjs'

export const transactionForAssociateComponentWithCurrentNote = (component: ComponentInterface, note: SNNote) => {
  const transaction: TransactionalMutation = {
    itemUuid: component.uuid,
    mutate: (m: ItemMutator) => {
      const mutator = m as ComponentMutator
      mutator.removeDisassociatedItemId(note.uuid)
      mutator.associateWithItem(note.uuid)
    },
  }
  return transaction
}

export const transactionForDisassociateComponentWithCurrentNote = (component: ComponentInterface, note: SNNote) => {
  const transaction: TransactionalMutation = {
    itemUuid: component.uuid,
    mutate: (m: ItemMutator) => {
      const mutator = m as ComponentMutator
      mutator.removeAssociatedItemId(note.uuid)
      mutator.disassociateWithItem(note.uuid)
    },
  }
  return transaction
}
