import { ContactPublicKeySetJsonInterface } from './ContactPublicKeySetJsonInterface'

export interface ContactPublicKeySetInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKeySet?: ContactPublicKeySetInterface

  findKeySetWithPublicKey(publicKey: string): ContactPublicKeySetInterface | undefined
  findKeySetWithSigningKey(signingKey: string): ContactPublicKeySetInterface | undefined

  asJson(): ContactPublicKeySetJsonInterface
  mutableCopy(): ContactPublicKeySetInterface
}
