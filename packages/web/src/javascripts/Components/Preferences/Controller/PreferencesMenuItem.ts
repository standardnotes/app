import { IconType } from '@standardnotes/snjs'
import { PreferencePaneId } from '@standardnotes/services'

export interface PreferencesMenuItem {
  readonly id: PreferencePaneId
  readonly icon: IconType
  readonly label: string
  readonly order: number
  readonly bubbleCount?: number
  readonly hasErrorIndicator?: boolean
}
