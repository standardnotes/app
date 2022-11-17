import { Uuid } from '@standardnotes/common'

export type WorkspaceInvitationAcceptingRequestParams = {
  inviteUuid: Uuid
  userUuid: Uuid
  publicKey: string
  encryptedPrivateKey: string
  [additionalParam: string]: unknown
}
