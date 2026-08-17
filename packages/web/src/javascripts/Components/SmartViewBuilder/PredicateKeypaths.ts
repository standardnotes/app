import { ListedName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

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
  | 'tags'

export const PredicateKeypathLabels: { [k in PredicateKeypath]: string } = {
  title: c('B4.Notes.TagsLinkedItems.Label').t`Title`,
  'title.length': c('B4.Notes.TagsLinkedItems.Label').t`Title Length`,
  text: c('B4.Notes.TagsLinkedItems.Label').t`Text`,
  'text.length': c('B4.Notes.TagsLinkedItems.Label').t`Text Length`,
  noteType: c('B4.Notes.TagsLinkedItems.Action').t`Note Type`,
  authorizedForListed: jtString(c('B4.Notes.TagsLinkedItems.Label').jt`Authorized For ${ListedName}`),
  editorIdentifier: c('B4.Notes.TagsLinkedItems.Label').t`Editor Identifier`,
  userModifiedDate: c('B4.Notes.TagsLinkedItems.Action').t`User Modified Date`,
  serverUpdatedAt: c('B4.Notes.TagsLinkedItems.Label').t`Server Updated At`,
  created_at: c('B4.Notes.TagsLinkedItems.Label').t`Created At`,
  conflict_of: c('B4.Notes.TagsLinkedItems.Action').t`Conflict Of`,
  protected: c('B4.Notes.TagsLinkedItems.Action').t`Protected`,
  trashed: c('B4.Notes.TagsLinkedItems.Action').t`Trashed`,
  pinned: c('B4.Notes.TagsLinkedItems.Label').t`Pinned`,
  archived: c('B4.Notes.TagsLinkedItems.Action').t`Archived`,
  locked: c('B4.Notes.TagsLinkedItems.Label').t`Locked`,
  starred: c('B4.Notes.TagsLinkedItems.Label').t`Starred`,
  hidePreview: c('B4.Notes.TagsLinkedItems.Label').t`Hide Preview`,
  spellcheck: c('B4.Notes.TagsLinkedItems.Label').t`Spellcheck`,
  tags: c('B4.Notes.TagsLinkedItems.Label').t`Tags`,
} as const

export const PredicateKeypathTypes: {
  [k in PredicateKeypath]: 'string' | 'noteType' | 'editorIdentifier' | 'number' | 'boolean' | 'date' | 'tag'
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
  tags: 'tag',
} as const
