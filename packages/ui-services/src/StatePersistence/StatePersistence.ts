export enum PersistenceKey {
  SelectedItemsController = 'selected-items-controller',
  NavigationController = 'navigation-controller',
}

export type SelectionControllerPersistableValue = {
  selectedUuids: string[]
}

export type NavigationControllerPersistableValue = {
  selectedTagUuid: string
}

export type PersistedStateValue = {
  [PersistenceKey.SelectedItemsController]: SelectionControllerPersistableValue
  [PersistenceKey.NavigationController]: NavigationControllerPersistableValue
}
