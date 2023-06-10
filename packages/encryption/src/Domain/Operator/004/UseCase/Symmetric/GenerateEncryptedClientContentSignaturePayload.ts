import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { SigningPayloadEmbeddedData } from '../../../../Types/EncryptionSigningData'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { ClientRawSigningData } from '@standardnotes/models'
import { GenerateEncryptedProtocolStringUseCase } from './GenerateEncryptedProtocolString'

export class GeneratePersistentClientSignature {
  private generateProtocolStringUseCase = new GenerateEncryptedProtocolStringUseCase(this.crypto)
  private base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    contentSigningData: SigningPayloadEmbeddedData,
    existingSignaturePayload: ClientRawSigningData | undefined,
    contentHash: string,
    contentKey: string,
    commonAuthenticatedData: ItemAuthenticatedData,
  ): string {
    let clientSignaturePayload: ClientRawSigningData = {
      plaintextHash: contentHash,
      signature: contentSigningData.signature,
      signerPublicKey: contentSigningData.publicKey,
    }

    if (existingSignaturePayload) {
      const needsNewSignature = contentHash !== existingSignaturePayload.plaintextHash
      if (!needsNewSignature) {
        clientSignaturePayload = existingSignaturePayload
      }
    }

    const nullSigningDataForClientOnlyEncryptedString = {}

    return this.generateProtocolStringUseCase.execute(
      JSON.stringify(clientSignaturePayload),
      contentKey,
      this.base64DataUsecase.execute(commonAuthenticatedData),
      this.base64DataUsecase.execute(nullSigningDataForClientOnlyEncryptedString),
    )
  }
}
