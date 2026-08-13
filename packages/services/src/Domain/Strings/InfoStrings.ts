import { c } from 'ttag'

export const InfoStrings = {
  get AccountDeleted() {
    return c('B1.Account.Session.Info').t`Your account has been successfully deleted.`
  },

  get InvalidNote() {
    return c('B2.NavSharedUI.Error')
      .t`The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.`
  },
}
