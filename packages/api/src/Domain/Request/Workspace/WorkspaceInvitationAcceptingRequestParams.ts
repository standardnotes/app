export type WorkspaceInvitationAcceptingRequestParams = {
  inviteUuid: string
  userUuid: string
  publicKey: string
  encryptedPrivateKey: string
  [additionalParam: string]: unknown
}
