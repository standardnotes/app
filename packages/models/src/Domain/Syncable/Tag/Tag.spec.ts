import { PayloadSource } from './../../Abstract/Payload/Types/PayloadSource'
import { DecryptedPayload } from './../../Abstract/Payload/Implementations/DecryptedPayload'
import { SNTag, TagContent } from './Tag'
import { ContentType } from '@standardnotes/common'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { ContentReference } from '../../Abstract/Reference/ContentReference'
import { PayloadTimestampDefaults } from '../../Abstract/Payload'

const randUuid = () => String(Math.random())

const create = (title: string, references: ContentReference[] = []): SNTag => {
  const tag = new SNTag(
    new DecryptedPayload(
      {
        uuid: randUuid(),
        content_type: ContentType.Tag,
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
      { uuid: randUuid(), content_type: ContentType.Note },
      { uuid: randUuid(), content_type: ContentType.Note },
      { uuid: randUuid(), content_type: ContentType.Tag },
    ])

    expect(tag.noteCount).toEqual(2)
  })
})
