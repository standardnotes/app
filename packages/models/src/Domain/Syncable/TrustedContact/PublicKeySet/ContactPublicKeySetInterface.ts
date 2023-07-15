import { ContactPublicKeySetJsonInterface } from './ContactPublicKeySetJsonInterface'

export interface ContactPublicKeySetInterface {
  encryption: string
  signing: string
  timestamp: Date
  isRevoked: boolean
  previousKeySet?: ContactPublicKeySetInterface

  findKeySet(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): ContactPublicKeySetInterface | undefined

  findKeySetWithPublicKey(publicKey: string): ContactPublicKeySetInterface | undefined
  findKeySetWithSigningKey(signingKey: string): ContactPublicKeySetInterface | undefined

  asJson(): ContactPublicKeySetJsonInterface
  mutableCopy(): ContactPublicKeySetInterface
}
