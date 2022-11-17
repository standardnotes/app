import { SNNote } from '@standardnotes/models'
import { Uuid } from '@standardnotes/common'
import { ListedAccount, ListedAccountInfo } from '@standardnotes/responses'

export interface ListedClientInterface {
  canRegisterNewListedAccount: () => boolean
  requestNewListedAccount: () => Promise<ListedAccount | undefined>
  getListedAccounts(): Promise<ListedAccount[]>
  getListedAccountInfo(account: ListedAccount, inContextOfItem?: Uuid): Promise<ListedAccountInfo | undefined>
  isNoteAuthorizedForListed(note: SNNote): boolean
  authorizeNoteForListed(note: SNNote): Promise<boolean>
}
