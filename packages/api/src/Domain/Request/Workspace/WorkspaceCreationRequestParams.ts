import { WorkspaceType } from '@standardnotes/common'

export type WorkspaceCreationRequestParams = {
  workspaceType: WorkspaceType
  encryptedWorkspaceKey?: string
  encryptedPrivateKey?: string
  publicKey?: string
  workspaceName?: string
  [additionalParam: string]: unknown
}
