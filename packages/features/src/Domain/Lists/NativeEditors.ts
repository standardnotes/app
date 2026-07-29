import { RoleName } from '@standardnotes/domain-core'
import { NoteType } from '../Component/NoteType'
import { EditorFeatureDescription } from '../Feature/EditorFeatureDescription'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { PermissionName } from '../Permission/PermissionName'
import { SuperName } from '../Strings/ProductNames'
import { c } from 'ttag'

export function nativeEditors(): EditorFeatureDescription[] {
  return [
    {
      name: SuperName,
      note_type: NoteType.Super,
      identifier: NativeFeatureIdentifier.TYPES.SuperEditor,
      spellcheckControl: true,
      file_type: 'json',
      interchangeable: false,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      permission_name: PermissionName.SuperEditor,
      description: c('B7.FilesSubscriptionHelp.Subscription.Info')
        .t`The best way to edit notes. Type / to bring up the block selection menu, or @ to embed images or link other tags and notes. Type - then space to start a list, or [] then space to start a checklist. Drag and drop an image or file to embed it in your note. Cmd/Ctrl + F to bring up search and replace.`,
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Plain Text`,
      note_type: NoteType.Plain,
      spellcheckControl: true,
      file_type: 'txt',
      interchangeable: true,
      identifier: NativeFeatureIdentifier.TYPES.PlainEditor,
      availableInRoles: [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      permission_name: PermissionName.PlainEditor,
    },
  ]
}
