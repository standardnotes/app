import { SharedVaultServerHash } from '@standardnotes/responses'

export type GetSharedVaultsResponse = {
  sharedVaults: SharedVaultServerHash[]
  designatedSurvivors: Array<{
    userUuid: string
    sharedVaultUuid: string
  }>
}
