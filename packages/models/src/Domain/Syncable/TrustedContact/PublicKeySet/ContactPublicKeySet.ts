import { ContactPublicKeySetInterface } from './ContactPublicKeySetInterface'
import { ContactPublicKeySetJsonInterface } from './ContactPublicKeySetJsonInterface'

export class ContactPublicKeySet implements ContactPublicKeySetInterface {
  encryption: string
  signing: string
  timestamp: Date
  isRevoked: boolean
  previousKeySet?: ContactPublicKeySetInterface

  constructor(dto: {
    encryption: string
    signing: string
    timestamp: Date
    isRevoked: boolean
    previousKeySet: ContactPublicKeySetInterface | undefined
  }) {
    this.encryption = dto.encryption
    this.signing = dto.signing
    this.timestamp = dto.timestamp
    this.isRevoked = dto.isRevoked
    this.previousKeySet = dto.previousKeySet
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

  asJson(): ContactPublicKeySetJsonInterface {
    return {
      encryption: this.encryption,
      signing: this.signing,
      timestamp: this.timestamp,
      isRevoked: this.isRevoked,
      previousKeySet: this.previousKeySet ? this.previousKeySet.asJson() : undefined,
    }
  }

  mutableCopy(): ContactPublicKeySetInterface {
    return new ContactPublicKeySet({
      encryption: this.encryption,
      signing: this.signing,
      timestamp: this.timestamp,
      isRevoked: this.isRevoked,
      previousKeySet: this.previousKeySet ? ContactPublicKeySet.FromJson(this.previousKeySet.asJson()) : undefined,
    })
  }

  static FromJson(json: ContactPublicKeySetJsonInterface): ContactPublicKeySetInterface {
    return new ContactPublicKeySet({
      encryption: json.encryption,
      signing: json.signing,
      timestamp: new Date(json.timestamp),
      isRevoked: json.isRevoked,
      previousKeySet: json.previousKeySet ? ContactPublicKeySet.FromJson(json.previousKeySet) : undefined,
    })
  }
}
