import { SNNote } from '@standardnotes/models'

export interface NotesControllerInterface {
  get firstSelectedNote(): SNNote | undefined
}
