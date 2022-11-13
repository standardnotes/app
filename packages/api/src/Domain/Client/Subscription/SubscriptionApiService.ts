import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { ApiVersion } from '../../Api/ApiVersion'
import { ApiEndpointParam } from '../../Request/ApiEndpointParam'
import { SubscriptionServerInterface } from '../../Server/Subscription/SubscriptionServerInterface'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'
import { SubscriptionInviteAcceptResponse } from '../../Response/Subscription/SubscriptionInviteAcceptResponse'

import { SubscriptionApiServiceInterface } from './SubscriptionApiServiceInterface'
import { SubscriptionApiOperations } from './SubscriptionApiOperations'
import { Uuid } from '@standardnotes/common'
import { AppleIAPConfirmResponse } from './../../Response/Subscription/AppleIAPConfirmResponse'
import { AppleIAPConfirmRequestParams } from '../../Request'

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

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(SubscriptionApiOperations.ListingInvites, false)
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

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(SubscriptionApiOperations.CancelingInvite, false)
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

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(SubscriptionApiOperations.Inviting, false)
    }
  }

  async acceptInvite(inviteUuid: Uuid): Promise<SubscriptionInviteAcceptResponse> {
    if (this.operationsInProgress.get(SubscriptionApiOperations.AcceptingInvite)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(SubscriptionApiOperations.AcceptingInvite, true)

    try {
      const response = await this.subscriptionServer.acceptInvite({
        inviteUuid,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(SubscriptionApiOperations.AcceptingInvite, false)
    }
  }

  async confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<AppleIAPConfirmResponse> {
    if (this.operationsInProgress.get(SubscriptionApiOperations.ConfirmAppleIAP)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(SubscriptionApiOperations.ConfirmAppleIAP, true)

    try {
      const response = await this.subscriptionServer.confirmAppleIAP(params)

      return response
    } finally {
      this.operationsInProgress.set(SubscriptionApiOperations.ConfirmAppleIAP, false)
    }
  }
}
