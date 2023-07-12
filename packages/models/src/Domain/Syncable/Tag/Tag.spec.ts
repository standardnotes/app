import { PayloadSource } from './../../Abstract/Payload/Types/PayloadSource'
import { DecryptedPayload } from './../../Abstract/Payload/Implementations/DecryptedPayload'
import { SNTag } from './Tag'
import { ContentType } from '@standardnotes/domain-core'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { ContentReference } from '../../Abstract/Reference/ContentReference'
import { PayloadTimestampDefaults } from '../../Abstract/Payload'
import { TagContent } from './TagContent'

const randUuid = () => String(Math.random())

const create = (title: string, references: ContentReference[] = []): SNTag => {
  const tag = new SNTag(
    new DecryptedPayload(
      {
        uuid: randUuid(),
        content_type: ContentType.TYPES.Tag,
        content: FillItemContent({
          title,
          references,
        } as TagContent),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )

  return tag
}

describe('SNTag Tests', () => {
  it('should count notes in the basic case', () => {
    const tag = create('helloworld', [
      { uuid: randUuid(), content_type: ContentType.TYPES.Note },
      { uuid: randUuid(), content_type: ContentType.TYPES.Note },
      { uuid: randUuid(), content_type: ContentType.TYPES.Tag },
    ])

    expect(tag.noteCount).toEqual(2)
  })

  it('preferences should be undefined if not specified', () => {
    const tag = create('helloworld', [])

    expect(tag.preferences).toBeFalsy()
  })
})
