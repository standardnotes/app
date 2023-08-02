import { ContentType } from '@standardnotes/domain-core'

import { ItemInterface } from '../Item/Interfaces/ItemInterface'
import { ContentReferenceType } from './ContenteReferenceType'
import { ContentReference } from './ContentReference'
import { LegacyAnonymousReference } from './LegacyAnonymousReference'
import { LegacyTagToNoteReference } from './LegacyTagToNoteReference'
import { Reference } from './Reference'
import { TagToParentTagReference } from './TagToParentTagReference'
import { AnonymousReference } from './AnonymousReference'

export const isLegacyAnonymousReference = (x: ContentReference): x is LegacyAnonymousReference => {
  return (x as AnonymousReference).reference_type === undefined
}

export const isReference = (x: ContentReference): x is Reference => {
  return (x as AnonymousReference).reference_type !== undefined
}

export const isLegacyTagToNoteReference = (
  x: LegacyAnonymousReference,
  currentItem: ItemInterface,
): x is LegacyTagToNoteReference => {
  const isReferenceToANote = x.content_type === ContentType.TYPES.Note
  const isReferenceFromATag = currentItem.content_type === ContentType.TYPES.Tag
  return isReferenceToANote && isReferenceFromATag
}

export const isTagToParentTagReference = (x: ContentReference): x is TagToParentTagReference => {
  return isReference(x) && x.reference_type === ContentReferenceType.TagToParentTag
}
