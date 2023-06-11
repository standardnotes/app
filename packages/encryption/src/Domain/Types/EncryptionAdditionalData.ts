export type SigningData = {
  signature: string
  publicKey: string
}

export type SymmetricItemAdditionalData = {
  signingData?: SigningData | undefined
}

export type AsymmetricItemAdditionalData = {
  signingData: SigningData
}

export type AdditionalData = SymmetricItemAdditionalData | AsymmetricItemAdditionalData
