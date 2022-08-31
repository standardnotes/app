import { InvitationStatus } from './InvitationStatus'
import { InviteeIdentifierType } from './InviteeIdentifierType'
import { InviterIdentifierType } from './InviterIdentifierType'

export type Invitation = {
  uuid: string
  inviterIdentifier: string
  inviterIdentifierType: InviterIdentifierType
  inviteeIdentifier: string
  inviteeIdentifierType: InviteeIdentifierType
  status: InvitationStatus
  subscriptionId: number
  createdAt: number
  updatedAt: number
}
