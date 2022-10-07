export type WorkspaceCreationRequestParams = {
  encryptedWorkspaceKey: string
  encryptedPrivateKey: string
  publicKey: string
  workspaceName?: string
  [additionalParam: string]: unknown
}
