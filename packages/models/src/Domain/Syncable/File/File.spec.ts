import { ConflictStrategy } from './../../Abstract/Item/Types/ConflictStrategy'
import { ContentType } from '@standardnotes/domain-core'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../Abstract/Payload'
import { FileContent, FileItem } from './File'
import { UuidGenerator } from '@standardnotes/utils'

UuidGenerator.SetGenerator(() => String(Math.random()))

describe('file', () => {
  const createFile = (content: Partial<FileContent> = {}): FileItem => {
    return new FileItem(
      new DecryptedPayload<FileContent>({
        uuid: '123',
        content_type: ContentType.TYPES.File,
        content: FillItemContent<FileContent>({
          name: 'name.png',
          key: 'secret',
          remoteIdentifier: 'A',
          encryptionHeader: 'header',
          encryptedChunkSizes: [1, 2, 3],
          ...content,
        }),
        dirty: true,
        ...PayloadTimestampDefaults(),
      }),
    )
  }

  const copyFile = (file: FileItem, override: Partial<FileContent> = {}): FileItem => {
    return new FileItem(
      file.payload.copy({
        content: {
          ...file.content,
          ...override,
        } as FileContent,
      }),
    )
  }

  it('should not copy on name conflict', () => {
    const file = createFile({ name: 'file.png' })
    const conflictedFile = copyFile(file, { name: 'different.png' })

    expect(file.strategyWhenConflictingWithItem(conflictedFile)).toEqual(ConflictStrategy.KeepBase)
  })

  it('should copy on key conflict', () => {
    const file = createFile({ name: 'file.png' })
    const conflictedFile = copyFile(file, { key: 'different-secret' })

    expect(file.strategyWhenConflictingWithItem(conflictedFile)).toEqual(ConflictStrategy.KeepBaseDuplicateApply)
  })

  it('should copy on header conflict', () => {
    const file = createFile({ name: 'file.png' })
    const conflictedFile = copyFile(file, { encryptionHeader: 'different-header' })

    expect(file.strategyWhenConflictingWithItem(conflictedFile)).toEqual(ConflictStrategy.KeepBaseDuplicateApply)
  })

  it('should copy on identifier conflict', () => {
    const file = createFile({ name: 'file.png' })
    const conflictedFile = copyFile(file, { remoteIdentifier: 'different-identifier' })

    expect(file.strategyWhenConflictingWithItem(conflictedFile)).toEqual(ConflictStrategy.KeepBaseDuplicateApply)
  })

  it('should copy on chunk sizes conflict', () => {
    const file = createFile({ name: 'file.png' })
    const conflictedFile = copyFile(file, { encryptedChunkSizes: [10, 9, 8] })

    expect(file.strategyWhenConflictingWithItem(conflictedFile)).toEqual(ConflictStrategy.KeepBaseDuplicateApply)
  })
})
