import { SNNote } from '@standardnotes/models'
import { ListedAccount, ListedAccountInfo } from '@standardnotes/responses'

export interface ListedClientInterface {
  canRegisterNewListedAccount: () => boolean
  requestNewListedAccount: () => Promise<ListedAccount | undefined>
  getListedAccounts(): Promise<ListedAccount[]>
  getListedAccountInfo(account: ListedAccount, inContextOfItem?: string): Promise<ListedAccountInfo | undefined>
  isNoteAuthorizedForListed(note: SNNote): boolean
  authorizeNoteForListed(note: SNNote): Promise<boolean>
}
