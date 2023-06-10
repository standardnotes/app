import { SigningPayloadEmbeddedData } from '../../../../Types/EncryptionSigningData'
import { ClientRawSigningData } from '@standardnotes/models'

export class GeneratePersistentClientSignature {
  execute(
    contentSigningData: SigningPayloadEmbeddedData,
    previousRawSigningData: ClientRawSigningData | undefined,
    newContentHash: string,
  ): ClientRawSigningData {
    if (previousRawSigningData) {
      const needsNewSignature = newContentHash !== previousRawSigningData.plaintextHash
      if (!needsNewSignature) {
        return previousRawSigningData
      }
    }

    const clientSignaturePayload: ClientRawSigningData = {
      plaintextHash: newContentHash,
      signature: contentSigningData.signature,
      signerPublicKey: contentSigningData.publicKey,
    }

    return clientSignaturePayload
  }
}
