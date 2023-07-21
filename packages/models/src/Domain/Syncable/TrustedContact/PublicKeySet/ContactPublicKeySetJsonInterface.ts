export interface ContactPublicKeySetJsonInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKeySet?: ContactPublicKeySetJsonInterface
}
