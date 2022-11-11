export type PredicateKeypath =
  | 'title'
  | 'title.length'
  | 'text'
  | 'text.length'
  | 'noteType'
  | 'authorizedForListed'
  | 'editorIdentifier'
  | 'userModifiedDate'
  | 'serverUpdatedAt'
  | 'created_at'
  | 'conflict_of'
  | 'protected'
  | 'trashed'
  | 'pinned'
  | 'archived'
  | 'locked'
  | 'starred'
  | 'hidePreview'
  | 'spellcheck'

export const PredicateKeypathLabels: { [k in PredicateKeypath]: string } = {
  title: 'Title',
  'title.length': 'Title Length',
  text: 'Text',
  'text.length': 'Text Length',
  noteType: 'Note Type',
  authorizedForListed: 'Authorized For Listed',
  editorIdentifier: 'Editor Identifier',
  userModifiedDate: 'User Modified Date',
  serverUpdatedAt: 'Server Updated At',
  created_at: 'Created At',
  conflict_of: 'Conflict Of',
  protected: 'Protected',
  trashed: 'Trashed',
  pinned: 'Pinned',
  archived: 'Archived',
  locked: 'Locked',
  starred: 'Starred',
  hidePreview: 'Hide Preview',
  spellcheck: 'Spellcheck',
} as const

export const PredicateKeypathTypes: {
  [k in PredicateKeypath]: 'string' | 'noteType' | 'editorIdentifier' | 'number' | 'boolean' | 'date'
} = {
  title: 'string',
  'title.length': 'number',
  text: 'string',
  'text.length': 'number',
  noteType: 'noteType',
  authorizedForListed: 'boolean',
  editorIdentifier: 'editorIdentifier',
  userModifiedDate: 'date',
  serverUpdatedAt: 'date',
  created_at: 'date',
  conflict_of: 'string',
  protected: 'boolean',
  trashed: 'boolean',
  pinned: 'boolean',
  archived: 'boolean',
  locked: 'boolean',
  starred: 'boolean',
  hidePreview: 'boolean',
  spellcheck: 'boolean',
} as const
