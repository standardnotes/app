import { WorkspaceAccessLevel, WorkspaceUserStatus } from '@standardnotes/common'

export type WorkspaceUser = {
  uuid: string
  accessLevel: WorkspaceAccessLevel
  userUuid: string
  userDisplayName: string | null
  workspaceUuid: string
  encryptedWorkspaceKey: string | null
  publicKey: string | null
  encryptedPrivateKey: string | null
  status: WorkspaceUserStatus
  keyRotationIndex: number
  createdAt: number
  updatedAt: number
}
