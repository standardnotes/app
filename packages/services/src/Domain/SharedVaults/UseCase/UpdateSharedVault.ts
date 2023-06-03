import { ClientDisplayableError, SharedVaultServerHash, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'

export class UpdateSharedVaultUseCase {
  constructor(private sharedVault: SharedVaultServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    specifiedItemsKeyUuid: string
  }): Promise<SharedVaultServerHash | ClientDisplayableError> {
    const response = await this.sharedVault.updateSharedVault({
      sharedVaultUuid: params.sharedVaultUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.sharedVault
  }
}
