import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { SubscriptionInviteRequestParams } from '../../Request/Subscription/SubscriptionInviteRequestParams'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

import { Paths } from './Paths'
import { SubscriptionServerInterface } from './SubscriptionServerInterface'

export class SubscriptionServer implements SubscriptionServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async invite(params: SubscriptionInviteRequestParams): Promise<SubscriptionInviteResponse> {
    const response = await this.httpService.post(Paths.v1.invite, params)

    return response as SubscriptionInviteResponse
  }
}
