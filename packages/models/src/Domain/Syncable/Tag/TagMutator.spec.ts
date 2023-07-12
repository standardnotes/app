import { ContentType } from '@standardnotes/domain-core'
import { ContentReferenceType, MutationType } from '../../Abstract/Item'
import { createFile, createTagWithContent, createTagWithTitle } from '../../Utilities/Test/SpecUtils'
import { SNTag } from './Tag'
import { TagMutator } from './TagMutator'

describe('tag mutator', () => {
  it('should add file to tag', () => {
    const file = createFile()

    const tag = createTagWithTitle()
    const mutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    mutator.addFile(file)
    const result = mutator.getResult()

    expect(result.content.references[0]).toEqual({
      uuid: file.uuid,
      content_type: ContentType.TYPES.File,
      reference_type: ContentReferenceType.TagToFile,
    })
  })

  it('should remove file from tag', () => {
    const file = createFile()

    const tag = createTagWithTitle()
    const addMutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    addMutator.addFile(file)
    const addResult = addMutator.getResult()

    const mutatedTag = new SNTag(addResult)
    const removeMutator = new TagMutator(mutatedTag, MutationType.UpdateUserTimestamps)
    removeMutator.removeFile(file)
    const removeResult = removeMutator.getResult()

    expect(removeResult.content.references).toHaveLength(0)
  })

  it('preferences should be undefined if previously undefined', () => {
    const tag = createTagWithTitle()
    const mutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    const result = mutator.getResult()

    expect(result.content.preferences).toBeFalsy()
  })

  it('preferences should be lazy-created if attempting to set a property', () => {
    const tag = createTagWithTitle()
    const mutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    mutator.preferences.sortBy = 'content_type'
    const result = mutator.getResult()

    expect(result.content.preferences?.sortBy).toEqual('content_type')
  })

  it('preferences should be nulled if client is reseting', () => {
    const tag = createTagWithContent({
      title: 'foo',
      preferences: {
        sortBy: 'content_type',
      },
    })

    const mutator = new TagMutator(tag, MutationType.UpdateUserTimestamps)
    mutator.preferences = undefined
    const result = mutator.getResult()

    expect(result.content.preferences).toBeFalsy()
  })
})
