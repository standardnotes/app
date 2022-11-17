import { KeyboardCommand } from './KeyboardCommands'

export type KeyboardCommandHandler = {
  command: KeyboardCommand
  onKeyDown?: (event: KeyboardEvent) => boolean | void
  onKeyUp?: (event: KeyboardEvent) => boolean | void
  element?: HTMLElement
  elements?: HTMLElement[]
  notElement?: HTMLElement
  notElementIds?: string[]
  notTags?: string[]
}
