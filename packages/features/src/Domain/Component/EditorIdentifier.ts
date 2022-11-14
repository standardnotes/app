import { FeatureIdentifier } from './../Feature/FeatureIdentifier'

export const SuperEditorIdentifier = 'super-editor'

export const PlainEditorIdentifier = 'plain-editor'

type ThirdPartyIdentifier = string

export type EditorIdentifier =
  | FeatureIdentifier
  | typeof PlainEditorIdentifier
  | typeof SuperEditorIdentifier
  | ThirdPartyIdentifier
