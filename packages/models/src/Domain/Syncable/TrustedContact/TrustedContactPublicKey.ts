import {
  TrustedContactPublicKeyInterface,
  TrustedContactPublicKeyJsonInterface,
} from './TrustedContactPublicKeyInterface'

export class TrustedContactPublicKey implements TrustedContactPublicKeyInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKey?: TrustedContactPublicKey

  constructor(encryption: string, signing: string, timestamp: Date, previousKey: TrustedContactPublicKey | undefined) {
    this.encryption = encryption
    this.signing = signing
    this.timestamp = timestamp
    this.previousKey = previousKey
  }

  public findPublicKey(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): TrustedContactPublicKeyInterface | undefined {
    if (this.encryption === params.targetEncryptionPublicKey && this.signing === params.targetSigningPublicKey) {
      return this
    }

    if (this.previousKey) {
      return this.previousKey.findPublicKey(params)
    }

    return undefined
  }

  static FromJson(json: TrustedContactPublicKeyJsonInterface): TrustedContactPublicKeyInterface {
    return new TrustedContactPublicKey(
      json.encryption,
      json.signing,
      new Date(json.timestamp),
      json.previousKey ? TrustedContactPublicKey.FromJson(json.previousKey) : undefined,
    )
  }
}
