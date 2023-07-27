import { EditorFeatureDescription } from '../Feature/EditorFeatureDescription'
import { FindNativeFeature } from '../Feature/Features'
import { IframeComponentFeatureDescription } from '../Feature/IframeComponentFeatureDescription'

export enum NoteType {
  Authentication = 'authentication',
  Code = 'code',
  Markdown = 'markdown',
  RichText = 'rich-text',
  Spreadsheet = 'spreadsheet',
  Task = 'task',
  Plain = 'plain-text',
  Super = 'super',
  Unknown = 'unknown',
}

export function noteTypeForEditorIdentifier(identifier: string): NoteType {
  const feature = FindNativeFeature<EditorFeatureDescription | IframeComponentFeatureDescription>(identifier)
  if (feature && feature.note_type) {
    return feature.note_type
  }

  return NoteType.Unknown
}
