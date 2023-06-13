import { ContactPublicKeySetInterface } from './ContactPublicKeySetInterface'
import { ContactPublicKeySetJsonInterface } from './ContactPublicKeySetJsonInterface'

export class ContactPublicKeySet implements ContactPublicKeySetInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKeySet?: ContactPublicKeySet

  constructor(encryption: string, signing: string, timestamp: Date, previousKeySet: ContactPublicKeySet | undefined) {
    this.encryption = encryption
    this.signing = signing
    this.timestamp = timestamp
    this.previousKeySet = previousKeySet
  }

  public findKeySet(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): ContactPublicKeySetInterface | undefined {
    if (this.encryption === params.targetEncryptionPublicKey && this.signing === params.targetSigningPublicKey) {
      return this
    }

    if (this.previousKeySet) {
      return this.previousKeySet.findKeySet(params)
    }

    return undefined
  }

  public findKeySetWithSigningKey(signingKey: string): ContactPublicKeySetInterface | undefined {
    if (this.signing === signingKey) {
      return this
    }

    if (this.previousKeySet) {
      return this.previousKeySet.findKeySetWithSigningKey(signingKey)
    }

    return undefined
  }

  findKeySetWithPublicKey(publicKey: string): ContactPublicKeySetInterface | undefined {
    if (this.encryption === publicKey) {
      return this
    }

    if (this.previousKeySet) {
      return this.previousKeySet.findKeySetWithPublicKey(publicKey)
    }

    return undefined
  }

  static FromJson(json: ContactPublicKeySetJsonInterface): ContactPublicKeySetInterface {
    return new ContactPublicKeySet(
      json.encryption,
      json.signing,
      new Date(json.timestamp),
      json.previousKeySet ? ContactPublicKeySet.FromJson(json.previousKeySet) : undefined,
    )
  }
}
