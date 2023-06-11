export type SigningData = {
  signature: string
  publicKey: string
}

export type SymmetricItemAdditionalData = {
  signingData?: SigningData | undefined
}

export type AsymmetricItemAdditionalData = {
  signingData: SigningData
  senderPublicKey: string
}

export type AdditionalData = SymmetricItemAdditionalData | AsymmetricItemAdditionalData
