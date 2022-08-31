import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { ApiVersion } from '../../Api/ApiVersion'
import { ApiEndpointParam } from '../../Request/ApiEndpointParam'
import { SubscriptionApiServiceInterface } from './SubscriptionApiServiceInterface'
import { SubscriptionServerInterface } from '../../Server/Subscription/SubscriptionServerInterface'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

export class SubscriptionApiService implements SubscriptionApiServiceInterface {
  private inviting: boolean

  constructor(private subscriptionServer: SubscriptionServerInterface) {
    this.inviting = false
  }

  async invite(inviteeEmail: string): Promise<SubscriptionInviteResponse> {
    if (this.inviting) {
      throw new ApiCallError(ErrorMessage.InvitingInProgress)
    }
    this.inviting = true

    try {
      const response = await this.subscriptionServer.invite({
        [ApiEndpointParam.ApiVersion]: ApiVersion.v0,
        identifier: inviteeEmail,
      })

      this.inviting = false

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    }
  }
}
