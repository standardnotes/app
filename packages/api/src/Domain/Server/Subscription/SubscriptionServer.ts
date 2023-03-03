import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { AppleIAPConfirmRequestParams } from '../../Request'
import { SubscriptionInviteAcceptRequestParams } from '../../Request/Subscription/SubscriptionInviteAcceptRequestParams'
import { SubscriptionInviteCancelRequestParams } from '../../Request/Subscription/SubscriptionInviteCancelRequestParams'
import { SubscriptionInviteDeclineRequestParams } from '../../Request/Subscription/SubscriptionInviteDeclineRequestParams'
import { SubscriptionInviteListRequestParams } from '../../Request/Subscription/SubscriptionInviteListRequestParams'
import { SubscriptionInviteRequestParams } from '../../Request/Subscription/SubscriptionInviteRequestParams'
import { AppleIAPConfirmResponseBody } from './../../Response/Subscription/AppleIAPConfirmResponseBody'
import { SubscriptionInviteAcceptResponseBody } from '../../Response/Subscription/SubscriptionInviteAcceptResponseBody'
import { SubscriptionInviteCancelResponseBody } from '../../Response/Subscription/SubscriptionInviteCancelResponseBody'
import { SubscriptionInviteDeclineResponseBody } from '../../Response/Subscription/SubscriptionInviteDeclineResponseBody'
import { SubscriptionInviteListResponseBody } from '../../Response/Subscription/SubscriptionInviteListResponseBody'
import { SubscriptionInviteResponseBody } from '../../Response/Subscription/SubscriptionInviteResponseBody'
import { HttpResponse } from '@standardnotes/responses'

import { Paths } from './Paths'
import { SubscriptionServerInterface } from './SubscriptionServerInterface'

export class SubscriptionServer implements SubscriptionServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async acceptInvite(
    params: SubscriptionInviteAcceptRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteAcceptResponseBody>> {
    return this.httpService.post(Paths.v1.acceptInvite(params.inviteUuid), params)
  }

  async declineInvite(
    params: SubscriptionInviteDeclineRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteDeclineResponseBody>> {
    return this.httpService.get(Paths.v1.declineInvite(params.inviteUuid), params)
  }

  async cancelInvite(
    params: SubscriptionInviteCancelRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteCancelResponseBody>> {
    return this.httpService.delete(Paths.v1.cancelInvite(params.inviteUuid), params)
  }

  async listInvites(
    params: SubscriptionInviteListRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteListResponseBody>> {
    return this.httpService.get(Paths.v1.listInvites, params)
  }

  async invite(params: SubscriptionInviteRequestParams): Promise<HttpResponse<SubscriptionInviteResponseBody>> {
    return this.httpService.post(Paths.v1.invite, params)
  }

  async confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<HttpResponse<AppleIAPConfirmResponseBody>> {
    return this.httpService.post(Paths.v1.confirmAppleIAP, params)
  }
}
