import { PayloadSource } from './../../Abstract/Payload/Types/PayloadSource'
import { DecryptedPayload } from './../../Abstract/Payload/Implementations/DecryptedPayload'
import { ContentType } from '@standardnotes/common'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { SNComponent } from './Component'
import { ComponentContent } from './ComponentContent'
import { PayloadTimestampDefaults } from '../../Abstract/Payload'
import { NoteType } from '@standardnotes/features'

describe('component model', () => {
  it('valid hosted url should ignore url', () => {
    const component = new SNComponent(
      new DecryptedPayload(
        {
          uuid: String(Math.random()),
          content_type: ContentType.Component,
          content: FillItemContent<ComponentContent>({
            url: 'http://foo.com',
            hosted_url: 'http://bar.com',
          } as ComponentContent),
          ...PayloadTimestampDefaults(),
        },
        PayloadSource.Constructor,
      ),
    )

    expect(component.hasValidHostedUrl()).toBe(true)
    expect(component.hosted_url).toBe('http://bar.com')
  })

  it('invalid hosted url should fallback to url', () => {
    const component = new SNComponent(
      new DecryptedPayload(
        {
          uuid: String(Math.random()),
          content_type: ContentType.Component,
          content: FillItemContent({
            url: 'http://foo.com',
            hosted_url: '#{foo.zoo}',
          } as ComponentContent),
          ...PayloadTimestampDefaults(),
        },
        PayloadSource.Constructor,
      ),
    )

    expect(component.hasValidHostedUrl()).toBe(true)
    expect(component.hosted_url).toBe('http://foo.com')
  })

  it('should return noteType as specified in package_info', () => {
    const component = new SNComponent(
      new DecryptedPayload(
        {
          uuid: String(Math.random()),
          content_type: ContentType.Component,
          content: FillItemContent({
            package_info: {
              note_type: NoteType.Authentication,
            },
          } as ComponentContent),
          ...PayloadTimestampDefaults(),
        },
        PayloadSource.Constructor,
      ),
    )

    expect(component.noteType).toEqual(NoteType.Authentication)
  })

  it('should return plain as noteType if no note type defined in package_info', () => {
    const component = new SNComponent(
      new DecryptedPayload(
        {
          uuid: String(Math.random()),
          content_type: ContentType.Component,
          content: FillItemContent({
            package_info: {},
          } as ComponentContent),
          ...PayloadTimestampDefaults(),
        },
        PayloadSource.Constructor,
      ),
    )

    expect(component.noteType).toEqual(NoteType.Plain)
  })
})
