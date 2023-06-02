import { EditorFeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { NoteType } from '../Component/NoteType'
import { FillEditorComponentDefaults } from './Utilities/FillEditorComponentDefaults'
import { RoleName } from '@standardnotes/domain-core'

export function editors(): EditorFeatureDescription[] {
  const code: EditorFeatureDescription = FillEditorComponentDefaults({
    name: 'Code',
    spellcheckControl: true,
    identifier: FeatureIdentifier.CodeEditor,
    permission_name: PermissionName.CodeEditor,
    note_type: NoteType.Code,
    file_type: 'txt',
    interchangeable: true,
    index_path: 'index.html',
    description:
      'Syntax highlighting and convenient keyboard shortcuts for over 120 programming' +
      ' languages. Ideal for code snippets and procedures.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/code.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const plus: EditorFeatureDescription = FillEditorComponentDefaults({
    name: 'Rich Text',
    note_type: NoteType.RichText,
    file_type: 'html',
    identifier: FeatureIdentifier.PlusEditor,
    permission_name: PermissionName.PlusEditor,
    spellcheckControl: true,
    description:
      'From highlighting to custom font sizes and colors, to tables and lists, this editor is perfect for crafting any document.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/plus-editor.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const markdown: EditorFeatureDescription = FillEditorComponentDefaults({
    name: 'Markdown',
    identifier: FeatureIdentifier.MarkdownProEditor,
    note_type: NoteType.Markdown,
    file_type: 'md',
    permission_name: PermissionName.MarkdownProEditor,
    spellcheckControl: true,
    description:
      'A fully featured Markdown editor that supports live preview, a styling toolbar, and split pane support.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/adv-markdown.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const task: EditorFeatureDescription = FillEditorComponentDefaults({
    name: 'Checklist',
    identifier: FeatureIdentifier.TaskEditor,
    note_type: NoteType.Task,
    spellcheckControl: true,
    file_type: 'md',
    interchangeable: false,
    permission_name: PermissionName.TaskEditor,
    description:
      'A great way to manage short-term and long-term to-do"s. You can mark tasks as completed, change their order, and edit the text naturally in place.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/task-editor.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const tokenvault: EditorFeatureDescription = FillEditorComponentDefaults({
    name: 'Authenticator',
    note_type: NoteType.Authentication,
    file_type: 'json',
    interchangeable: false,
    identifier: FeatureIdentifier.TokenVaultEditor,
    permission_name: PermissionName.TokenVaultEditor,
    description:
      'Encrypt and protect your 2FA secrets for all your internet accounts. Authenticator handles your 2FA secrets so that you never lose them again, or have to start over when you get a new device.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/token-vault.png',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const spreadsheets: EditorFeatureDescription = FillEditorComponentDefaults({
    name: 'Spreadsheet',
    identifier: FeatureIdentifier.SheetsEditor,
    note_type: NoteType.Spreadsheet,
    file_type: 'json',
    interchangeable: false,
    permission_name: PermissionName.SheetsEditor,
    description:
      'A powerful spreadsheet editor with formatting and formula support. Not recommended for large data sets, as encryption of such data may decrease editor performance.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/spreadsheets.png',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  return [code, plus, markdown, task, tokenvault, spreadsheets]
}
