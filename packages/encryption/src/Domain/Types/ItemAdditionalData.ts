export type SymmetricItemAdditionalData = {
  signing?: {
    publicKey: string
    signature: string
  }
}

export type AsymmetricAdditionalData = {
  signing: {
    publicKey: string
    signature: string
  }
}

export type EncryptionAdditionalData = SymmetricItemAdditionalData | AsymmetricAdditionalData
