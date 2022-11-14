import { Invitation } from '@standardnotes/models'
import { SubscriptionApiServiceInterface } from '@standardnotes/api'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { SubscriptionClientInterface } from './SubscriptionClientInterface'
import { Uuid } from '@standardnotes/common'
import { AppleIAPReceipt } from './AppleIAPReceipt'

export class SubscriptionManager extends AbstractService implements SubscriptionClientInterface {
  constructor(
    private subscriptionApiService: SubscriptionApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async acceptInvitation(inviteUuid: string): Promise<{ success: true } | { success: false; message: string }> {
    try {
      const result = await this.subscriptionApiService.acceptInvite(inviteUuid)

      if (result.data.error) {
        return { success: false, message: result.data.error.message }
      }

      return result.data
    } catch (error) {
      return { success: false, message: 'Could not accept invitation.' }
    }
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

  async confirmAppleIAP(
    params: AppleIAPReceipt,
    subscriptionToken: string,
  ): Promise<{ success: true } | { success: false; message: string }> {
    try {
      const result = await this.subscriptionApiService.confirmAppleIAP({
        ...params,
        subscription_token: subscriptionToken,
      })

      if (result.data.error) {
        return { success: false, message: result.data.error.message }
      }

      return result.data
    } catch (error) {
      return { success: false, message: 'Could not confirm IAP.' }
    }
  }
}
