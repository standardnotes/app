import { c } from 'ttag'

export const InfoStrings = {
  AccountDeleted: 'Your account has been successfully deleted.',

  get InvalidNote() {
    return c('B2.SharedUI.Error')
      .t`The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.`
  },
}
