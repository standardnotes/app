/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContentType } from '@standardnotes/common'
import { ItemInterface } from '../Item/Interfaces/ItemInterface'
import { ContenteReferenceType } from './ContenteReferenceType'
import { ContentReference } from './ContentReference'
import { LegacyAnonymousReference } from './LegacyAnonymousReference'
import { LegacyTagToNoteReference } from './LegacyTagToNoteReference'
import { Reference } from './Reference'
import { TagToParentTagReference } from './TagToParentTagReference'

export const isLegacyAnonymousReference = (x: ContentReference): x is LegacyAnonymousReference => {
  return (x as any).reference_type === undefined
}

export const isReference = (x: ContentReference): x is Reference => {
  return (x as any).reference_type !== undefined
}

export const isLegacyTagToNoteReference = (
  x: LegacyAnonymousReference,
  currentItem: ItemInterface,
): x is LegacyTagToNoteReference => {
  const isReferenceToANote = x.content_type === ContentType.Note
  const isReferenceFromATag = currentItem.content_type === ContentType.Tag
  return isReferenceToANote && isReferenceFromATag
}

export const isTagToParentTagReference = (x: ContentReference): x is TagToParentTagReference => {
  return isReference(x) && x.reference_type === ContenteReferenceType.TagToParentTag
}
