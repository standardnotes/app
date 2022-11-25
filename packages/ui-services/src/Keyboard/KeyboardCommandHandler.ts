import { KeyboardCommand } from './KeyboardCommands'

export type KeyboardCommandHandler = {
  command: KeyboardCommand
  onKeyDown?: (event: KeyboardEvent, data?: unknown) => boolean | void
  onKeyUp?: (event: KeyboardEvent, data?: unknown) => boolean | void
  element?: HTMLElement
  elements?: HTMLElement[]
  notElement?: HTMLElement
  notElementIds?: string[]
  notTags?: string[]
}
