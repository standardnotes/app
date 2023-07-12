import { DecryptedPayload } from './../../Abstract/Payload/Implementations/DecryptedPayload'
import { SNNote } from '../Note/Note'
import { SmartView } from './SmartView'
import { SmartViewContent } from './SmartViewContent'
import { SystemViewId } from './SystemViewId'
import { ItemWithTags } from '../../Runtime/Display/Search/ItemWithTags'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { Predicate } from '../../Runtime/Predicate/Predicate'
import { CompoundPredicate } from '../../Runtime/Predicate/CompoundPredicate'
import { PayloadTimestampDefaults } from '../../Abstract/Payload'
import { NotesAndFilesDisplayOptions } from '../../Runtime/Display'
import { FileItem } from '../File'
import { ContentType } from '@standardnotes/domain-core'

export function BuildSmartViews(options: NotesAndFilesDisplayOptions): SmartView[] {
  const notes = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.AllNotes,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Notes',
        predicate: allNotesPredicate(options).toJson(),
      }),
    }),
  )

  const files = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.Files,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Files',
        predicate: filesPredicate(options).toJson(),
      }),
    }),
  )

  const archived = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.ArchivedNotes,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Archived',
        predicate: archivedNotesPredicate(options).toJson(),
      }),
    }),
  )

  const trash = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.TrashedNotes,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Trash',
        predicate: trashedNotesPredicate(options).toJson(),
      }),
    }),
  )

  const untagged = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.UntaggedNotes,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Untagged',
        predicate: untaggedNotesPredicate(options).toJson(),
      }),
    }),
  )

  const starred = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.StarredNotes,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Starred',
        predicate: starredNotesPredicate(options).toJson(),
      }),
    }),
  )

  const conflicts = new SmartView(
    new DecryptedPayload({
      uuid: SystemViewId.Conflicts,
      content_type: ContentType.TYPES.SmartView,
      ...PayloadTimestampDefaults(),
      content: FillItemContent<SmartViewContent>({
        title: 'Conflicts',
        predicate: conflictsPredicate(options).toJson(),
      }),
    }),
  )

  return [notes, files, starred, archived, trash, untagged, conflicts]
}

function allNotesPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates: Predicate<SNNote>[] = [new Predicate('content_type', '=', ContentType.TYPES.Note)]

  if (options.includeTrashed === false) {
    subPredicates.push(new Predicate('trashed', '=', false))
  }
  if (options.includeArchived === false) {
    subPredicates.push(new Predicate('archived', '=', false))
  }
  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }
  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }
  const predicate = new CompoundPredicate('and', subPredicates)

  return predicate
}

function filesPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates: Predicate<FileItem>[] = [new Predicate('content_type', '=', ContentType.TYPES.File)]

  if (options.includeTrashed === false) {
    subPredicates.push(new Predicate('trashed', '=', false))
  }
  if (options.includeArchived === false) {
    subPredicates.push(new Predicate('archived', '=', false))
  }
  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }
  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }
  const predicate = new CompoundPredicate('and', subPredicates)

  return predicate
}

function archivedNotesPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates: Predicate<SNNote>[] = [
    new Predicate('archived', '=', true),
    new Predicate('content_type', '=', ContentType.TYPES.Note),
  ]
  if (options.includeTrashed === false) {
    subPredicates.push(new Predicate('trashed', '=', false))
  }
  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }
  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }
  const predicate = new CompoundPredicate('and', subPredicates)

  return predicate
}

function trashedNotesPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates: Predicate<SNNote>[] = [
    new Predicate('trashed', '=', true),
    new Predicate('content_type', '=', ContentType.TYPES.Note),
  ]
  if (options.includeArchived === false) {
    subPredicates.push(new Predicate('archived', '=', false))
  }
  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }
  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }
  const predicate = new CompoundPredicate('and', subPredicates)

  return predicate
}

function untaggedNotesPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates = [
    new Predicate('content_type', '=', ContentType.TYPES.Note),
    new Predicate<ItemWithTags>('tagsCount', '=', 0),
  ]
  if (options.includeArchived === false) {
    subPredicates.push(new Predicate('archived', '=', false))
  }
  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }
  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }
  const predicate = new CompoundPredicate('and', subPredicates)

  return predicate
}

function starredNotesPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates: Predicate<SNNote>[] = [
    new Predicate('starred', '=', true),
    new Predicate('content_type', '=', ContentType.TYPES.Note),
  ]
  if (options.includeTrashed === false) {
    subPredicates.push(new Predicate('trashed', '=', false))
  }
  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }
  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }
  const predicate = new CompoundPredicate('and', subPredicates)

  return predicate
}

function conflictsPredicate(options: NotesAndFilesDisplayOptions) {
  const subPredicates: Predicate<SNNote>[] = [new Predicate('content_type', '=', ContentType.TYPES.Note)]

  if (options.includeTrashed === false) {
    subPredicates.push(new Predicate('trashed', '=', false))
  }

  if (options.includeArchived === false) {
    subPredicates.push(new Predicate('archived', '=', false))
  }

  if (options.includeProtected === false) {
    subPredicates.push(new Predicate('protected', '=', false))
  }

  if (options.includePinned === false) {
    subPredicates.push(new Predicate('pinned', '=', false))
  }

  const predicate = new CompoundPredicate('and', subPredicates)
  return predicate
}
