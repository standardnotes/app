import { TrustedContactPublicKey } from './TrustedContactPublicKey'

export interface TrustedContactPublicKeyInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKey: TrustedContactPublicKeyInterface | null

  findPublicKey(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): TrustedContactPublicKey | null
}
