export interface WorkspaceClientInterface {
  createWorkspace(dto: {
    encryptedWorkspaceKey: string
    encryptedPrivateKey: string
    publicKey: string
    workspaceName?: string
  }): Promise<{ uuid: string } | null>
}
