import { doesPayloadRequireSigning } from '@standardnotes/encryption/src/Domain/Operator/004/V004AlgorithmHelpers'
import { DecryptedItemInterface, PayloadSource, PublicKeyTrustStatus } from '@standardnotes/models'
import { ItemSignatureValidationResult } from './Types/ItemSignatureValidationResult'
import { FindContact } from './FindContact'

export class ValidateItemSigner {
  constructor(private findContact: FindContact) {}

  execute(item: DecryptedItemInterface): ItemSignatureValidationResult {
    const uuidOfLastEditor = item.last_edited_by_uuid
    if (uuidOfLastEditor) {
      return this.validateSignatureWithLastEditedByUuid(item, uuidOfLastEditor)
    } else {
      return this.validateSignatureWithNoLastEditedByUuid(item)
    }
  }

  private isItemLocallyCreatedAndDoesNotRequireSignature(item: DecryptedItemInterface): boolean {
    return item.payload.source === PayloadSource.Constructor
  }

  private isItemResutOfRemoteSaveAndDoesNotRequireSignature(item: DecryptedItemInterface): boolean {
    return item.payload.source === PayloadSource.RemoteSaved
  }

  private validateSignatureWithLastEditedByUuid(
    item: DecryptedItemInterface,
    uuidOfLastEditor: string,
  ): ItemSignatureValidationResult {
    const requiresSignature = doesPayloadRequireSigning(item)

    const trustedContact = this.findContact.execute({ userUuid: uuidOfLastEditor })
    if (trustedContact.isFailed()) {
      if (requiresSignature) {
        return ItemSignatureValidationResult.NotTrusted
      } else {
        return ItemSignatureValidationResult.NotApplicable
      }
    }

    if (!item.signatureData) {
      if (
        this.isItemLocallyCreatedAndDoesNotRequireSignature(item) ||
        this.isItemResutOfRemoteSaveAndDoesNotRequireSignature(item)
      ) {
        return ItemSignatureValidationResult.NotApplicable
      }
      if (requiresSignature) {
        return ItemSignatureValidationResult.NotTrusted
      }
      return ItemSignatureValidationResult.NotApplicable
    }

    const signatureData = item.signatureData
    if (!signatureData.result) {
      if (signatureData.required) {
        return ItemSignatureValidationResult.NotTrusted
      }
      return ItemSignatureValidationResult.NotApplicable
    }

    const signatureResult = signatureData.result

    if (!signatureResult.passes) {
      return ItemSignatureValidationResult.NotTrusted
    }

    const signerPublicKey = signatureResult.publicKey

    const trustStatus = trustedContact.getValue().getTrustStatusForSigningPublicKey(signerPublicKey)
    if (trustStatus === PublicKeyTrustStatus.Trusted) {
      return ItemSignatureValidationResult.Trusted
    } else if (trustStatus === PublicKeyTrustStatus.Previous) {
      return ItemSignatureValidationResult.SignedWithNonCurrentKey
    }

    return ItemSignatureValidationResult.NotTrusted
  }

  private validateSignatureWithNoLastEditedByUuid(item: DecryptedItemInterface): ItemSignatureValidationResult {
    const requiresSignature = doesPayloadRequireSigning(item)

    if (!item.signatureData) {
      if (
        this.isItemLocallyCreatedAndDoesNotRequireSignature(item) ||
        this.isItemResutOfRemoteSaveAndDoesNotRequireSignature(item)
      ) {
        return ItemSignatureValidationResult.NotApplicable
      }

      if (requiresSignature) {
        return ItemSignatureValidationResult.NotTrusted
      }

      return ItemSignatureValidationResult.NotApplicable
    }

    const signatureData = item.signatureData
    if (!signatureData.result) {
      if (signatureData.required) {
        return ItemSignatureValidationResult.NotTrusted
      }
      return ItemSignatureValidationResult.NotApplicable
    }

    const signatureResult = signatureData.result

    if (!signatureResult.passes) {
      return ItemSignatureValidationResult.NotTrusted
    }

    const signerPublicKey = signatureResult.publicKey

    const trustedContact = this.findContact.execute({ signingPublicKey: signerPublicKey })
    if (trustedContact.isFailed()) {
      return ItemSignatureValidationResult.NotTrusted
    }

    const trustStatus = trustedContact.getValue().getTrustStatusForSigningPublicKey(signerPublicKey)
    if (trustStatus === PublicKeyTrustStatus.Trusted) {
      return ItemSignatureValidationResult.Trusted
    } else if (trustStatus === PublicKeyTrustStatus.Previous) {
      return ItemSignatureValidationResult.SignedWithNonCurrentKey
    }

    return ItemSignatureValidationResult.NotTrusted
  }
}
