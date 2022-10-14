import { UuidString } from '@standardnotes/snjs'

export type SelectionControllerPersistableValue = {
  selectedUuids: UuidString[]
}

export type NavigationControllerPersistableValue = {
  selectedUuid: UuidString
}

export type PersistedState = {
  selectionController: SelectionControllerPersistableValue
  navigationController: NavigationControllerPersistableValue
}
