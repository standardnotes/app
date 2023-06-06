import { TrustedContactPublicKeyInterface } from './TrustedContactPublicKeyInterface'

export class TrustedContactPublicKey implements TrustedContactPublicKeyInterface {
  encryption: string
  signing: string
  timestamp: Date
  previousKey: TrustedContactPublicKey | null

  constructor(
    encryption: string,
    signing: string,
    timestamp: Date,
    previousKey: TrustedContactPublicKey | null = null,
  ) {
    this.encryption = encryption
    this.signing = signing
    this.timestamp = timestamp
    this.previousKey = previousKey
  }

  public findPublicKey(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): TrustedContactPublicKeyInterface | null {
    if (this.encryption === params.targetEncryptionPublicKey && this.signing === params.targetSigningPublicKey) {
      return this
    }

    if (this.previousKey) {
      return this.previousKey.findPublicKey(params)
    }

    return null
  }

  static FromJson(json: TrustedContactPublicKeyInterface): TrustedContactPublicKeyInterface {
    return new TrustedContactPublicKey(
      json.encryption,
      json.signing,
      new Date(json.timestamp),
      json.previousKey ? TrustedContactPublicKey.FromJson(json.previousKey) : null,
    )
  }
}
