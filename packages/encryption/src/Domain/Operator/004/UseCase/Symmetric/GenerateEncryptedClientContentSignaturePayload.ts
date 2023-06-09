import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { SigningPayloadEmbeddedData } from '../../../../Types/EncryptionSigningData'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { ClientSignaturePayload } from '@standardnotes/models'
import { GenerateEncryptedProtocolStringUseCase } from './GenerateEncryptedProtocolString'

export class GenerateEncryptedClientContentSignaturePayload {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    contentSigningData: SigningPayloadEmbeddedData,
    contentHash: string,
    contentKey: string,
    commonAuthenticatedData: ItemAuthenticatedData,
  ): string {
    const clientSignaturePayload: ClientSignaturePayload = {
      plaintextHash: contentHash,
      signature: contentSigningData.signature,
      signerPublicKey: contentSigningData.publicKey,
    }

    const generateProtocolStringUseCase = new GenerateEncryptedProtocolStringUseCase(this.crypto)
    const base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)

    const nullSigningDataForClientOnlyEncryptedString = {}
    const encryptedClientSignaturePayload = generateProtocolStringUseCase.execute(
      JSON.stringify(clientSignaturePayload),
      contentKey,
      base64DataUsecase.execute(commonAuthenticatedData),
      base64DataUsecase.execute(nullSigningDataForClientOnlyEncryptedString),
    )

    return encryptedClientSignaturePayload
  }
}
