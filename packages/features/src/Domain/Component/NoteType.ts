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
  if (identifier === FeatureIdentifier.PlainEditor) {
    return NoteType.Plain
  } else if (identifier === FeatureIdentifier.SuperEditor) {
    return NoteType.Super
  }

  return NoteType.Unknown
}
