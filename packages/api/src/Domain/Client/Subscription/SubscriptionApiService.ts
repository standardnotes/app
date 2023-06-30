import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { ApiVersion } from '../../Api/ApiVersion'

import { SubscriptionServerInterface } from '../../Server/Subscription/SubscriptionServerInterface'
import { AppleIAPConfirmResponseBody } from './../../Response/Subscription/AppleIAPConfirmResponseBody'
import { SubscriptionInviteAcceptResponseBody } from '../../Response/Subscription/SubscriptionInviteAcceptResponseBody'
import { SubscriptionInviteCancelResponseBody } from '../../Response/Subscription/SubscriptionInviteCancelResponseBody'
import { SubscriptionInviteListResponseBody } from '../../Response/Subscription/SubscriptionInviteListResponseBody'
import { SubscriptionInviteResponseBody } from '../../Response/Subscription/SubscriptionInviteResponseBody'
import { HttpResponse, ApiEndpointParam } from '@standardnotes/responses'

import { SubscriptionApiServiceInterface } from './SubscriptionApiServiceInterface'
import { SubscriptionApiOperations } from './SubscriptionApiOperations'
import { AppleIAPConfirmRequestParams } from '../../Request'

export class SubscriptionApiService implements SubscriptionApiServiceInterface {
  private operationsInProgress: Map<SubscriptionApiOperations, boolean>

  constructor(private subscriptionServer: SubscriptionServerInterface) {
    this.operationsInProgress = new Map()
  }

  async listInvites(): Promise<HttpResponse<SubscriptionInviteListResponseBody>> {
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

  async cancelInvite(inviteUuid: string): Promise<HttpResponse<SubscriptionInviteCancelResponseBody>> {
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

  async invite(inviteeEmail: string): Promise<HttpResponse<SubscriptionInviteResponseBody>> {
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

  async acceptInvite(inviteUuid: string): Promise<HttpResponse<SubscriptionInviteAcceptResponseBody>> {
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

  async confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<HttpResponse<AppleIAPConfirmResponseBody>> {
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
