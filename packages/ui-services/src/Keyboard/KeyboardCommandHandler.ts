import { KeyboardCommand } from './KeyboardCommands'
import { KeyboardShortcutCategory } from './KeyboardShortcut'

export type KeyboardCommandHandler = {
  command: KeyboardCommand
  category?: KeyboardShortcutCategory
  description?: string
  onKeyDown?: (event: KeyboardEvent, data?: unknown) => boolean | void
  onKeyUp?: (event: KeyboardEvent, data?: unknown) => boolean | void
  element?: HTMLElement
  elements?: HTMLElement[]
  notElement?: HTMLElement
  notElementIds?: string[]
  notTags?: string[]
}
