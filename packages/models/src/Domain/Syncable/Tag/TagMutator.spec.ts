import { ContentType } from '@standardnotes/common'
import { ContenteReferenceType, MutationType } from '../../Abstract/Item'
import { createFile, createTag } from '../../Utilities/Test/SpecUtils'
import { SNTag } from './Tag'
import { TagMutator } from './TagMutator'

describe('tag mutator', () => {
  it('should add file to tag', () => {
    const file = createFile()

    const tag = createTag()
    const mutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    mutator.addFile(file)
    const result = mutator.getResult()

    expect(result.content.references[0]).toEqual({
      uuid: file.uuid,
      content_type: ContentType.File,
      reference_type: ContenteReferenceType.TagToFile,
    })
  })

  it('should remove file from tag', () => {
    const file = createFile()

    const tag = createTag()
    const addMutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    addMutator.addFile(file)
    const addResult = addMutator.getResult()

    const mutatedTag = new SNTag(addResult)
    const removeMutator = new TagMutator(mutatedTag, MutationType.UpdateUserTimestamps)
    removeMutator.removeFile(file)
    const removeResult = removeMutator.getResult()

    expect(removeResult.content.references).toHaveLength(0)
  })
})
