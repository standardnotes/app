import { AppleIAPConfirmResponse } from './../../Response/Subscription/AppleIAPConfirmResponse'
import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { AppleIAPConfirmRequestParams } from '../../Request'
import { SubscriptionInviteAcceptRequestParams } from '../../Request/Subscription/SubscriptionInviteAcceptRequestParams'
import { SubscriptionInviteCancelRequestParams } from '../../Request/Subscription/SubscriptionInviteCancelRequestParams'
import { SubscriptionInviteDeclineRequestParams } from '../../Request/Subscription/SubscriptionInviteDeclineRequestParams'
import { SubscriptionInviteListRequestParams } from '../../Request/Subscription/SubscriptionInviteListRequestParams'
import { SubscriptionInviteRequestParams } from '../../Request/Subscription/SubscriptionInviteRequestParams'
import { SubscriptionInviteAcceptResponse } from '../../Response/Subscription/SubscriptionInviteAcceptResponse'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'
import { SubscriptionInviteDeclineResponse } from '../../Response/Subscription/SubscriptionInviteDeclineResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

import { Paths } from './Paths'
import { SubscriptionServerInterface } from './SubscriptionServerInterface'

export class SubscriptionServer implements SubscriptionServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async acceptInvite(params: SubscriptionInviteAcceptRequestParams): Promise<SubscriptionInviteAcceptResponse> {
    const response = await this.httpService.post(Paths.v1.acceptInvite(params.inviteUuid), params)

    return response as SubscriptionInviteAcceptResponse
  }

  async declineInvite(params: SubscriptionInviteDeclineRequestParams): Promise<SubscriptionInviteDeclineResponse> {
    const response = await this.httpService.get(Paths.v1.declineInvite(params.inviteUuid), params)

    return response as SubscriptionInviteDeclineResponse
  }

  async cancelInvite(params: SubscriptionInviteCancelRequestParams): Promise<SubscriptionInviteCancelResponse> {
    const response = await this.httpService.delete(Paths.v1.cancelInvite(params.inviteUuid), params)

    return response as SubscriptionInviteCancelResponse
  }

  async listInvites(params: SubscriptionInviteListRequestParams): Promise<SubscriptionInviteListResponse> {
    const response = await this.httpService.get(Paths.v1.listInvites, params)

    return response as SubscriptionInviteListResponse
  }

  async invite(params: SubscriptionInviteRequestParams): Promise<SubscriptionInviteResponse> {
    const response = await this.httpService.post(Paths.v1.invite, params)

    return response as SubscriptionInviteResponse
  }

  async confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<AppleIAPConfirmResponse> {
    const response = await this.httpService.post(Paths.v1.confirmAppleIAP, params)

    return response as AppleIAPConfirmResponse
  }
}
