import { TagContent } from './../../Syncable/Tag/TagContent'
import { FillItemContent, ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedPayload, PayloadSource, PayloadTimestampDefaults } from '../../Abstract/Payload'
import { FileContent, FileItem } from '../../Syncable/File'
import { NoteContent, SNNote } from '../../Syncable/Note'
import { SNTag } from '../../Syncable/Tag'
import { SmartView, SmartViewContent } from '../../Syncable/SmartView'
import { ContentType } from '@standardnotes/domain-core'

let currentId = 0

export const mockUuid = () => {
  return `${currentId++}`
}

export const createNote = (content?: Partial<NoteContent>): SNNote => {
  return new SNNote(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.Note,
        content: FillItemContent({ ...content }),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const createNoteWithContent = (content: Partial<NoteContent>, createdAt?: Date): SNNote => {
  return new SNNote(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.Note,
        content: FillItemContent<NoteContent>(content),
        ...PayloadTimestampDefaults(),
        created_at: createdAt || new Date(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const createTagWithContent = (content: Partial<TagContent>): SNTag => {
  return new SNTag(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.Tag,
        content: FillItemContent<TagContent>(content),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const createSmartViewWithContent = (content: Partial<SmartViewContent>): SmartView => {
  return new SmartView(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.SmartView,
        content: FillItemContent<SmartViewContent>(content),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const createTagWithTitle = (title = 'photos') => {
  return new SNTag(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.Tag,
        content: FillItemContent<TagContent>({ title }),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const createSmartViewWithTitle = (title = 'photos') => {
  return new SmartView(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.SmartView,
        content: FillItemContent<SmartViewContent>({ title }),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const createFile = (name = 'screenshot.png') => {
  return new FileItem(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.File,
        content: FillItemContent<FileContent>({ name }),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

export const pinnedContent = (): Partial<ItemContent> => {
  return {
    appData: {
      'org.standardnotes.sn': {
        pinned: true,
      },
    },
  }
}
