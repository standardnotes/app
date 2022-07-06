import { ActionResponse } from './ActionResponse'

export type ListedAccountInfo = ActionResponse & {
  display_name: string
  author_url: string
  settings_url: string
}
