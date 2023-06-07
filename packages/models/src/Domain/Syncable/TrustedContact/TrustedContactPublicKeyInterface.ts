import { TrustedContactPublicKey } from './TrustedContactPublicKey'

export interface TrustedContactPublicKeyJsonInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKey?: TrustedContactPublicKeyJsonInterface
}

export interface TrustedContactPublicKeyInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKey?: TrustedContactPublicKeyInterface

  findPublicKey(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): TrustedContactPublicKey | undefined
}
