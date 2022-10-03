/* istanbul ignore file */

import { Uuid } from '@standardnotes/common'

export interface ItemSharingInvite {
  uuid: Uuid
  itemUuid: Uuid
  senderEmail: string
  recipientEmail: string
  status: 'pending' | 'accepted' | 'rejected'
}
