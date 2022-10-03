import { Uuid } from '@standardnotes/common'

export interface EncryptedWorkspaceKeyShareInterface {
  uuid: Uuid
  senderPublicKey: string
  encryptedKey: string
  type: 'workspace'
}

export interface DecryptedWorkspaceKeyShareInterface {
  uuid: Uuid
  workspaceKey: string
  type: 'workspace'
}
