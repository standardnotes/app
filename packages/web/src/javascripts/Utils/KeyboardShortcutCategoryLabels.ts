import { KeyboardShortcutCategory } from '@standardnotes/ui-services'
import { SuperName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

/** Display order in the keyboard shortcuts help modal. */
export const KEYBOARD_SHORTCUT_CATEGORY_ORDER: KeyboardShortcutCategory[] = [
  'Current note',
  'Formatting',
  'Super notes',
  'Notes list',
  'General',
  'Search',
]

/** Localized label for a stable keyboard shortcut category id. */
export function translateKeyboardShortcutCategory(category: KeyboardShortcutCategory): string {
  switch (category) {
    case 'General':
      return c('B2.NavSharedUI.Label').t`General`
    case 'Notes list':
      return c('B2.NavSharedUI.Label').t`Notes list`
    case 'Current note':
      return c('B2.NavSharedUI.Label').t`Current note`
    case 'Super notes':
      return jtString(c('B2.NavSharedUI.Label').jt`${SuperName} notes`)
    case 'Formatting':
      return c('B2.NavSharedUI.Label').t`Formatting`
    case 'Search':
      return c('B2.NavSharedUI.Label').t`Search`
  }
}
