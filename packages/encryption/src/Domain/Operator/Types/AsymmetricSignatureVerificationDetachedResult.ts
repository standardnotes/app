export type AsymmetricSignatureVerificationDetachedResult =
  | {
      signatureVerified: true
      signaturePublicKey: string
      senderPublicKey: string
    }
  | {
      signatureVerified: false
    }
