export interface FileProtocolV1 {
  readonly encryptionHeader: string
  readonly key: string
  readonly remoteIdentifier: string
}

export enum FileProtocolV1Constants {
  KeySize = 256,
}
