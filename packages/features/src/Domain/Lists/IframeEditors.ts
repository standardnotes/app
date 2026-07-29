import { PermissionName } from '../Permission/PermissionName'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { NoteType } from '../Component/NoteType'
import { FillIframeEditorDefaults } from './Utilities/FillEditorComponentDefaults'
import { RoleName } from '@standardnotes/domain-core'
import { IframeComponentFeatureDescription } from '../Feature/IframeComponentFeatureDescription'
import { AuthenticatorName, SpreadsheetName } from '../Strings/ProductNames'
import { c } from 'ttag'

export function IframeEditors(): IframeComponentFeatureDescription[] {
  const tokenvault = FillIframeEditorDefaults({
    name: AuthenticatorName,
    note_type: NoteType.Authentication,
    file_type: 'json',
    interchangeable: false,
    identifier: NativeFeatureIdentifier.TYPES.TokenVaultEditor,
    permission_name: PermissionName.TokenVaultEditor,
    description: c('B7.FilesSubscriptionHelp.Subscription.Info')
      .t`Encrypt and protect your 2FA secrets for all your internet accounts. Authenticator handles your 2FA secrets so that you never lose them again, or have to start over when you get a new device.`,
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/token-vault.png',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const spreadsheets = FillIframeEditorDefaults({
    name: SpreadsheetName,
    identifier: NativeFeatureIdentifier.TYPES.SheetsEditor,
    note_type: NoteType.Spreadsheet,
    file_type: 'json',
    interchangeable: false,
    permission_name: PermissionName.SheetsEditor,
    description: c('B7.FilesSubscriptionHelp.Subscription.Info')
      .t`A powerful spreadsheet editor with formatting and formula support. Not recommended for large data sets, as encryption of such data may decrease editor performance.`,
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/spreadsheets.png',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  return [tokenvault, spreadsheets]
}
