export type CreateValetTokenPayload = {
  operation: 'read' | 'write' | 'delete'
  resources: Array<{
    remoteIdentifier: string
    unencryptedFileSize?: number
  }>
}
