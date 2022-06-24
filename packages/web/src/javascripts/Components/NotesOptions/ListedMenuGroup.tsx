import { Action, ListedAccount } from '@standardnotes/snjs'

export type ListedMenuGroup = {
  name: string
  account: ListedAccount
  actions: Action[]
}
