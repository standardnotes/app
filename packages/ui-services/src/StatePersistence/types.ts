import { UuidString } from '@standardnotes/snjs'

export type SelectionControllerPersistableValue = {
  selectedUuids: UuidString[]
}

export type NavigationControllerPersistableValue = {
  selectedUuid: UuidString
}

export enum PersistedStateKey {
  SelectionController = 'selectionController',
  NavigationController = 'navigationController',
}

export type PersistedState = {
  [PersistedStateKey.SelectionController]: SelectionControllerPersistableValue
  [PersistedStateKey.NavigationController]: NavigationControllerPersistableValue
}
