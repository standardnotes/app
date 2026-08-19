import { ContentType } from '@standardnotes/domain-core'
import { FillItemContent } from '../../Content/ItemContent'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../Payload'
import { PayloadSource } from '../../Payload/Types/PayloadSource'
import { ConflictStrategy } from '../Types/ConflictStrategy'
import { AppDataField } from '../Types/AppDataField'
import { DefaultAppDomain } from '../Types/DefaultAppDomain'
import { SNNote } from '../../../Syncable/Note/Note'
import { NoteContent } from '../../../Syncable/Note/NoteContent'

describe('GenericItem strategyWhenConflictingWithItem', () => {
  const createNote = (
    overrides: {
      title?: string
      text?: string
      dirty?: boolean
      userModifiedDate?: Date
      source?: PayloadSource
    } = {},
  ): SNNote => {
    const now = overrides.userModifiedDate ?? new Date()
    return new SNNote(
      new DecryptedPayload<NoteContent>(
        {
          uuid: 'note-uuid',
          content_type: ContentType.TYPES.Note,
          ...PayloadTimestampDefaults(),
          dirty: overrides.dirty,
          content: FillItemContent<NoteContent>({
            title: overrides.title ?? 'Test Note',
            text: overrides.text ?? 'some text',
            appData: {
              [DefaultAppDomain]: {
                [AppDataField.UserModifiedDate]: now.toISOString(),
              },
            },
          }),
        },
        overrides.source,
      ),
    )
  }

  const createIncomingNote = (
    overrides: { title?: string; text?: string; source?: PayloadSource } = {},
  ): SNNote => {
    return new SNNote(
      new DecryptedPayload<NoteContent>(
        {
          uuid: 'incoming-uuid',
          content_type: ContentType.TYPES.Note,
          ...PayloadTimestampDefaults(),
          content: FillItemContent<NoteContent>({
            title: overrides.title ?? 'Incoming Note',
            text: overrides.text ?? 'different text',
          }),
        },
        overrides.source,
      ),
    )
  }

  it('should keep apply when local item is not dirty and content differs', () => {
    const localNote = createNote({
      title: 'Local Title',
      dirty: false,
      userModifiedDate: new Date(Date.now() - 120_000),
    })
    const incomingNote = createIncomingNote({ title: 'Server Title' })

    const strategy = localNote.strategyWhenConflictingWithItem(incomingNote)

    expect(strategy).toBe(ConflictStrategy.KeepApply)
  })

  it('should duplicate base when local item is dirty and content differs', () => {
    const localNote = createNote({
      title: 'Local Title',
      dirty: true,
      userModifiedDate: new Date(Date.now() - 120_000),
    })
    const incomingNote = createIncomingNote({ title: 'Server Title' })

    const strategy = localNote.strategyWhenConflictingWithItem(incomingNote)

    expect(strategy).toBe(ConflictStrategy.DuplicateBaseKeepApply)
  })

  it('should keep base and duplicate apply when edited within 60 seconds', () => {
    const localNote = createNote({
      title: 'Local Title',
      dirty: true,
      userModifiedDate: new Date(Date.now() - 30_000),
    })
    const incomingNote = createIncomingNote({ title: 'Server Title' })

    const strategy = localNote.strategyWhenConflictingWithItem(incomingNote)

    expect(strategy).toBe(ConflictStrategy.KeepBaseDuplicateApply)
  })

  it('should not treat 60+ seconds ago as actively editing', () => {
    const localNote = createNote({
      title: 'Local Title',
      dirty: true,
      userModifiedDate: new Date(Date.now() - 61_000),
    })
    const incomingNote = createIncomingNote({ title: 'Server Title' })

    const strategy = localNote.strategyWhenConflictingWithItem(incomingNote)

    expect(strategy).toBe(ConflictStrategy.DuplicateBaseKeepApply)
  })

  it('should keep base duplicate apply for file imports regardless of dirty state', () => {
    const localNote = createNote({
      title: 'Local Title',
      dirty: false,
      userModifiedDate: new Date(Date.now() - 120_000),
    })
    const incomingNote = createIncomingNote({
      title: 'Imported Title',
      source: PayloadSource.FileImport,
    })

    const strategy = localNote.strategyWhenConflictingWithItem(incomingNote)

    expect(strategy).toBe(ConflictStrategy.KeepBaseDuplicateApply)
  })
})
