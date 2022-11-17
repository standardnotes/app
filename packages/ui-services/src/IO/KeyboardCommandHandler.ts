import { KeyboardCommand } from './KeyboardCommands'

export type KeyboardCommandHandler = {
  command: KeyboardCommand
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  element?: HTMLElement
  elements?: HTMLElement[]
  notElement?: HTMLElement
  notElementIds?: string[]
  notTags?: string[]
}
