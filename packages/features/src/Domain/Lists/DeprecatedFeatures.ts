import { AnyFeatureDescription } from '../Feature/AnyFeatureDescription'
import { EditorFeatureDescription } from '../Feature/EditorFeatureDescription'
import { IframeComponentFeatureDescription } from '../Feature/IframeComponentFeatureDescription'
import { ContentType, RoleName } from '@standardnotes/domain-core'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { NoteType } from '../Component/NoteType'
import { FillIframeEditorDefaults } from './Utilities/FillEditorComponentDefaults'
import { ComponentAction } from '../Component/ComponentAction'
import { ComponentArea } from '../Component/ComponentArea'

export function GetDeprecatedFeatures(): AnyFeatureDescription[] {
  const bold: EditorFeatureDescription = FillIframeEditorDefaults({
    name: 'Alternative Rich Text',
    identifier: FeatureIdentifier.DeprecatedBoldEditor,
    note_type: NoteType.RichText,
    file_type: 'html',
    component_permissions: [
      {
        name: ComponentAction.StreamContextItem,
        content_types: [ContentType.TYPES.Note],
      },
      {
        name: ComponentAction.StreamItems,
        content_types: [
          ContentType.TYPES.FilesafeCredentials,
          ContentType.TYPES.FilesafeFileMetadata,
          ContentType.TYPES.FilesafeIntegration,
        ],
      },
    ],
    spellcheckControl: true,
    deprecated: true,
    permission_name: PermissionName.BoldEditor,
    description: 'A simple and peaceful rich editor that helps you write and think clearly.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/bold.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const markdownBasic: EditorFeatureDescription = FillIframeEditorDefaults({
    name: 'Basic Markdown',
    identifier: FeatureIdentifier.DeprecatedMarkdownBasicEditor,
    note_type: NoteType.Markdown,
    spellcheckControl: true,
    file_type: 'md',
    deprecated: true,
    permission_name: PermissionName.MarkdownBasicEditor,
    description: 'A Markdown editor with dynamic split-pane preview.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/simple-markdown.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const markdownAlt: EditorFeatureDescription = FillIframeEditorDefaults({
    name: 'Markdown Alternative',
    identifier: FeatureIdentifier.DeprecatedMarkdownVisualEditor,
    note_type: NoteType.Markdown,
    file_type: 'md',
    deprecated: true,
    permission_name: PermissionName.MarkdownVisualEditor,
    spellcheckControl: true,
    description:
      'A WYSIWYG-style Markdown editor that renders Markdown in preview-mode while you type without displaying any syntax.',
    index_path: 'build/index.html',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const markdownMinimist: EditorFeatureDescription = FillIframeEditorDefaults({
    name: 'Minimal Markdown',
    identifier: FeatureIdentifier.DeprecatedMarkdownMinimistEditor,
    note_type: NoteType.Markdown,
    file_type: 'md',
    index_path: 'index.html',
    permission_name: PermissionName.MarkdownMinimistEditor,
    spellcheckControl: true,
    deprecated: true,
    description: 'A minimal Markdown editor with live rendering and in-text search via Ctrl/Cmd + F',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/min-markdown.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const markdownMath: EditorFeatureDescription = FillIframeEditorDefaults({
    name: 'Markdown with Math',
    identifier: FeatureIdentifier.DeprecatedMarkdownMathEditor,
    spellcheckControl: true,
    permission_name: PermissionName.MarkdownMathEditor,
    note_type: NoteType.Markdown,
    file_type: 'md',
    deprecated: true,
    index_path: 'index.html',
    description: 'A beautiful split-pane Markdown editor with synced-scroll, LaTeX support, and colorful syntax.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/editors/fancy-markdown.jpg',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const filesafe: IframeComponentFeatureDescription = FillIframeEditorDefaults({
    name: 'FileSafe',
    identifier: FeatureIdentifier.DeprecatedFileSafe,
    component_permissions: [
      {
        name: ComponentAction.StreamContextItem,
        content_types: [ContentType.TYPES.Note],
      },
      {
        name: ComponentAction.StreamItems,
        content_types: [
          ContentType.TYPES.FilesafeCredentials,
          ContentType.TYPES.FilesafeFileMetadata,
          ContentType.TYPES.FilesafeIntegration,
        ],
      },
    ],
    permission_name: PermissionName.ComponentFilesafe,
    area: ComponentArea.EditorStack,
    deprecated: true,
    description:
      'Encrypted attachments for your notes using your Dropbox, Google Drive, or WebDAV server. Limited to 50MB per file.',
    thumbnail_url: 'https://assets.standardnotes.com/screenshots/models/FileSafe-banner.png',
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  return [bold, markdownBasic, markdownMinimist, markdownMath, markdownAlt, filesafe]
}
