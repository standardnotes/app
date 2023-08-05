import { SNNote } from '@standardnotes/snjs'

export type NotesOptionsProps = {
  notes: SNNote[]
  requestDisableClickOutside?: (disabled: boolean) => void
  closeMenu: () => void
}
