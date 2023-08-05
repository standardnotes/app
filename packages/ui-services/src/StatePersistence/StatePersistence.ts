export enum PersistenceKey {
  ItemListController = 'selected-items-controller',
  NavigationController = 'navigation-controller',
}

export type SelectionControllerPersistableValue = {
  selectedUuids: string[]
}

export type NavigationControllerPersistableValue = {
  selectedTagUuid: string
}

export type PersistedStateValue = {
  [PersistenceKey.ItemListController]: SelectionControllerPersistableValue
  [PersistenceKey.NavigationController]: NavigationControllerPersistableValue
}
