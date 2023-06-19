export interface ContactPublicKeySetJsonInterface {
  encryption: string
  signing: string
  timestamp: Date
  isRevoked: boolean
  previousKeySet?: ContactPublicKeySetJsonInterface
}
