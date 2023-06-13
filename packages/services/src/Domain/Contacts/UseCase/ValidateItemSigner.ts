import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { doesPayloadRequireSigning } from '@standardnotes/encryption/src/Domain/Operator/004/V004AlgorithmHelpers'
import { DecryptedItemInterface } from '@standardnotes/models'
import { ValidateItemSignerResult } from './ValidateItemSignerResult'
import { FindTrustedContactUseCase } from './FindTrustedContact'

export class ValidateItemSignerUseCase {
  private findContactUseCase = new FindTrustedContactUseCase(this.items)

  constructor(private items: ItemManagerInterface) {}

  execute(item: DecryptedItemInterface): ValidateItemSignerResult {
    const uuidOfLastEditor = item.last_edited_by_uuid
    if (!uuidOfLastEditor) {
      return this.validateSignatureWithNoLastEditedByUuid(item)
    } else {
      return this.validateSignatureWithLastEditedByUuid(item, uuidOfLastEditor)
    }
  }

  private validateSignatureWithNoLastEditedByUuid(item: DecryptedItemInterface): ValidateItemSignerResult {
    const requiresSignature = doesPayloadRequireSigning(item.payload)

    if (!item.signatureResult) {
      if (requiresSignature) {
        return 'no'
      }

      return 'not-applicable'
    }

    const signatureData = item.signatureResult
    if (!signatureData.result) {
      if (signatureData.required) {
        return 'no'
      }
      return 'not-applicable'
    }

    const signatureResult = signatureData.result

    if (!signatureResult.passes) {
      return 'no'
    }

    const signerPublicKey = signatureResult.publicKey

    const trustedContact = this.findContactUseCase.execute({ signingPublicKey: signerPublicKey })

    if (!trustedContact) {
      return 'no'
    }

    return 'yes'
  }

  private validateSignatureWithLastEditedByUuid(
    item: DecryptedItemInterface,
    uuidOfLastEditor: string,
  ): ValidateItemSignerResult {
    const requiresSignature = doesPayloadRequireSigning(item.payload)
    const trustedContact = this.findContactUseCase.execute({ userUuid: uuidOfLastEditor })
    if (!trustedContact) {
      if (requiresSignature) {
        return 'no'
      } else {
        return 'not-applicable'
      }
    }

    if (!item.signatureResult) {
      if (requiresSignature) {
        return 'no'
      } else {
        return 'not-applicable'
      }
    }

    const signatureData = item.signatureResult
    if (!signatureData.result) {
      if (signatureData.required) {
        return 'no'
      }
      return 'not-applicable'
    }

    const signatureResult = signatureData.result

    if (!signatureResult.passes) {
      return 'no'
    }

    const signerPublicKey = signatureResult.publicKey

    if (trustedContact.isSigningKeyTrusted(signerPublicKey)) {
      return 'yes'
    }

    return 'no'
  }
}
