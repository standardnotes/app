import { EditorIdentifier, PlainEditorIdentifier, SuperEditorIdentifier } from './EditorIdentifier'

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

export function noteTypeForEditorIdentifier(identifier: EditorIdentifier | string): NoteType {
  if (identifier === PlainEditorIdentifier) {
    return NoteType.Plain
  } else if (identifier === SuperEditorIdentifier) {
    return NoteType.Super
  }

  return NoteType.Unknown
}
