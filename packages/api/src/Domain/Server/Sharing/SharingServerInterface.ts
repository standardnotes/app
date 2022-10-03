import { ItemInviteAcceptRequestParams } from '../../Request/Sharing/ItemInviteAcceptRequestParams'
import { ItemInviteCancelRequestParams } from '../../Request/Sharing/ItemInviteCancelRequestParams'
import { ItemInviteDeclineRequestParams } from '../../Request/Sharing/ItemInviteDeclineRequestParams'
import { ItemInviteListRequestParams } from '../../Request/Sharing/ItemInviteListRequestParams'
import { ItemInviteRequestParams } from '../../Request/Sharing/ItemInviteRequestParams'
import { ItemInviteAcceptResponse } from '../../Response/Sharing/ItemInviteAcceptResponse'
import { ItemInviteCancelResponse } from '../../Response/Sharing/ItemInviteCancelResponse'
import { ItemInviteDeclineResponse } from '../../Response/Sharing/ItemInviteDeclineResponse'
import { ItemInviteListResponse } from '../../Response/Sharing/ItemInviteListResponse'
import { ItemInviteResponse } from '../../Response/Sharing/ItemInviteResponse'

export interface SharingServerInterface {
  invite(params: ItemInviteRequestParams): Promise<ItemInviteResponse>
  acceptInvite(params: ItemInviteAcceptRequestParams): Promise<ItemInviteAcceptResponse>
  declineInvite(params: ItemInviteDeclineRequestParams): Promise<ItemInviteDeclineResponse>
  cancelInvite(params: ItemInviteCancelRequestParams): Promise<ItemInviteCancelResponse>
  listInvites(params: ItemInviteListRequestParams): Promise<ItemInviteListResponse>
}
