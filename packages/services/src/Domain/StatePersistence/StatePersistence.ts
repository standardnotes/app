import { DisplayOptions } from '@standardnotes/models'

export const MasterStatePersistenceKey = 'master-persistence-key'

export enum PersistenceKey {
  SelectedItemsController = 'selected-items-controller',
  NavigationController = 'navigation-controller',
  ItemListController = 'item-list-controller',
}

export type SelectionControllerPersistableValue = {
  selectedUuids: string[]
}

export type NavigationControllerPersistableValue = {
  selectedTagUuid: string
}

export type ItemListControllerPersistableValue = {
  displayOptions: DisplayOptions
}

export type PersistedStateValue = {
  [PersistenceKey.SelectedItemsController]: SelectionControllerPersistableValue
  [PersistenceKey.NavigationController]: NavigationControllerPersistableValue
  [PersistenceKey.ItemListController]: ItemListControllerPersistableValue
}
