import { ContactPublicKeySetInterface } from './ContactPublicKeySetInterface'
import { ContactPublicKeySetJsonInterface } from './ContactPublicKeySetJsonInterface'

export class ContactPublicKeySet implements ContactPublicKeySetInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKeySet?: ContactPublicKeySetInterface

  constructor(dto: {
    encryption: string
    signing: string
    timestamp: Date
    previousKeySet: ContactPublicKeySetInterface | undefined
  }) {
    this.encryption = dto.encryption
    this.signing = dto.signing
    this.timestamp = dto.timestamp
    this.previousKeySet = dto.previousKeySet
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

  asJson(): ContactPublicKeySetJsonInterface {
    return {
      encryption: this.encryption,
      signing: this.signing,
      timestamp: this.timestamp,
      previousKeySet: this.previousKeySet ? this.previousKeySet.asJson() : undefined,
    }
  }

  mutableCopy(): ContactPublicKeySetInterface {
    return new ContactPublicKeySet({
      encryption: this.encryption,
      signing: this.signing,
      timestamp: this.timestamp,
      previousKeySet: this.previousKeySet ? ContactPublicKeySet.FromJson(this.previousKeySet.asJson()) : undefined,
    })
  }

  static FromJson(json: ContactPublicKeySetJsonInterface): ContactPublicKeySetInterface {
    return new ContactPublicKeySet({
      encryption: json.encryption,
      signing: json.signing,
      timestamp: new Date(json.timestamp),
      previousKeySet: json.previousKeySet ? ContactPublicKeySet.FromJson(json.previousKeySet) : undefined,
    })
  }
}
