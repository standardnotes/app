import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { ApiVersion } from '../../Api/ApiVersion'
import { ApiEndpointParam } from '../../Request/ApiEndpointParam'
import { SubscriptionServerInterface } from '../../Server/Subscription/SubscriptionServerInterface'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'

import { SubscriptionApiServiceInterface } from './SubscriptionApiServiceInterface'
import { SubscriptionApiOperations } from './SubscriptionApiOperations'

export class SubscriptionApiService implements SubscriptionApiServiceInterface {
  private operationsInProgress: Map<SubscriptionApiOperations, boolean>

  constructor(private subscriptionServer: SubscriptionServerInterface) {
    this.operationsInProgress = new Map()
  }

  async listInvites(): Promise<SubscriptionInviteListResponse> {
    if (this.operationsInProgress.get(SubscriptionApiOperations.ListingInvites)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(SubscriptionApiOperations.ListingInvites, true)

    try {
      const response = await this.subscriptionServer.listInvites({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
      })

      this.operationsInProgress.set(SubscriptionApiOperations.ListingInvites, false)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  async cancelInvite(inviteUuid: string): Promise<SubscriptionInviteCancelResponse> {
    if (this.operationsInProgress.get(SubscriptionApiOperations.CancelingInvite)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(SubscriptionApiOperations.CancelingInvite, true)

    try {
      const response = await this.subscriptionServer.cancelInvite({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
        inviteUuid,
      })

      this.operationsInProgress.set(SubscriptionApiOperations.CancelingInvite, false)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }

  async invite(inviteeEmail: string): Promise<SubscriptionInviteResponse> {
    if (this.operationsInProgress.get(SubscriptionApiOperations.Inviting)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(SubscriptionApiOperations.Inviting, true)

    try {
      const response = await this.subscriptionServer.invite({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
        identifier: inviteeEmail,
      })

      this.operationsInProgress.set(SubscriptionApiOperations.Inviting, false)

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }
}
