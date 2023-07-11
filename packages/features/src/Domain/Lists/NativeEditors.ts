import { RoleName } from '@standardnotes/domain-core'
import { NoteType } from '../Component/NoteType'
import { EditorFeatureDescription } from '../Feature/EditorFeatureDescription'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { PermissionName } from '../Permission/PermissionName'

export function nativeEditors(): EditorFeatureDescription[] {
  return [
    {
      name: 'Super',
      note_type: NoteType.Super,
      identifier: FeatureIdentifier.SuperEditor,
      file_type: 'json',
      interchangeable: false,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      permission_name: PermissionName.SuperEditor,
      description:
        'A new way to edit notes. Type / to bring up the block selection menu, or @ to embed images or link other tags and notes. Type - then space to start a list, or [] then space to start a checklist. Drag and drop an image or file to embed it in your note. Cmd/Ctrl + F to bring up search and replace.',
    },
    {
      name: 'Plain Text',
      note_type: NoteType.Plain,
      file_type: 'txt',
      interchangeable: true,
      identifier: FeatureIdentifier.PlainEditor,
      availableInRoles: [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      permission_name: PermissionName.PlainEditor,
    },
  ]
}
