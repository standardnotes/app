import { IconType } from '@standardnotes/snjs'
import { PreferenceId } from '@standardnotes/ui-services'

export interface PreferencesMenuItem {
  readonly id: PreferenceId
  readonly icon: IconType
  readonly label: string
  readonly order: number
  readonly hasBubble?: boolean
}
