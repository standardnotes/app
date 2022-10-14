import { UuidString } from '@standardnotes/snjs'

export type SelectionControllerPersistableValue = {
  selectedUuids: UuidString[]
}

export type NavigationControllerPersistableValue = {
  selectedUuid: UuidString
}

export type PersistedState = Partial<SelectionControllerPersistableValue> &
  Partial<NavigationControllerPersistableValue>
