import { EditorFeatureDescription } from '../Feature/EditorFeatureDescription'
import { FindNativeFeature } from '../Feature/Features'
import { IframeComponentFeatureDescription } from '../Feature/IframeComponentFeatureDescription'
import { FeatureIdentifier } from './../Feature/FeatureIdentifier'
import { EditorIdentifier } from './EditorIdentifier'

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

export function noteTypeForEditorIdentifier(identifier: EditorIdentifier): NoteType {
  const feature = FindNativeFeature<EditorFeatureDescription | IframeComponentFeatureDescription>(
    identifier as FeatureIdentifier,
  )
  if (feature && feature.note_type) {
    return feature.note_type
  }

  return NoteType.Unknown
}
