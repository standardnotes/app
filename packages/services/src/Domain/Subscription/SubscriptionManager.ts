import { Invitation } from '@standardnotes/models'
import { SubscriptionApiServiceInterface } from '@standardnotes/api'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { SubscriptionClientInterface } from './SubscriptionClientInterface'
import { Uuid } from '@standardnotes/common'

export class SubscriptionManager extends AbstractService implements SubscriptionClientInterface {
  constructor(
    private subscriptionApiService: SubscriptionApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async listSubscriptionInvitations(): Promise<Invitation[]> {
    try {
      const response = await this.subscriptionApiService.listInvites()

      return response.data.invitations ?? []
    } catch (error) {
      return []
    }
  }

  async inviteToSubscription(inviteeEmail: string): Promise<boolean> {
    try {
      const result = await this.subscriptionApiService.invite(inviteeEmail)

      return result.data.success === true
    } catch (error) {
      return false
    }
  }

  async cancelInvitation(inviteUuid: Uuid): Promise<boolean> {
    try {
      const result = await this.subscriptionApiService.cancelInvite(inviteUuid)

      return result.data.success === true
    } catch (error) {
      return false
    }
  }
}
