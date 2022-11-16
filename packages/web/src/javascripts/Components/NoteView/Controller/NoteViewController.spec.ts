import { WebApplication } from '@/Application/Application'
import { ContentType } from '@standardnotes/common'
import {
  MutatorService,
  SNComponentManager,
  SNComponent,
  SNTag,
  ItemsClientInterface,
  SNNote,
} from '@standardnotes/snjs'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { NoteViewController } from './NoteViewController'

describe('note view controller', () => {
  let application: WebApplication
  let componentManager: SNComponentManager

  beforeEach(() => {
    application = {} as jest.Mocked<WebApplication>
    application.streamItems = jest.fn()
    application.getPreference = jest.fn().mockReturnValue(true)
    Object.defineProperty(application, 'items', { value: {} as jest.Mocked<ItemsClientInterface> })

    componentManager = {} as jest.Mocked<SNComponentManager>
    componentManager.legacyGetDefaultEditor = jest.fn()
    Object.defineProperty(application, 'componentManager', { value: componentManager })

    const mutator = {} as jest.Mocked<MutatorService>
    mutator.createTemplateItem = jest.fn().mockReturnValue({} as SNNote)
    Object.defineProperty(application, 'mutator', { value: mutator })
  })

  it('should create notes with plaintext note type', async () => {
    application.geDefaultEditorIdentifier = jest.fn().mockReturnValue(FeatureIdentifier.PlainEditor)

    const controller = new NoteViewController(application)
    await controller.initialize()

    expect(application.mutator.createTemplateItem).toHaveBeenCalledWith(
      ContentType.Note,
      expect.objectContaining({ noteType: NoteType.Plain }),
      expect.anything(),
    )
  })

  it('should create notes with markdown note type', async () => {
    componentManager.legacyGetDefaultEditor = jest.fn().mockReturnValue({
      identifier: FeatureIdentifier.MarkdownProEditor,
    } as SNComponent)

    componentManager.componentWithIdentifier = jest.fn().mockReturnValue({
      identifier: FeatureIdentifier.MarkdownProEditor,
    } as SNComponent)

    application.geDefaultEditorIdentifier = jest.fn().mockReturnValue(FeatureIdentifier.MarkdownProEditor)

    const controller = new NoteViewController(application)
    await controller.initialize()

    expect(application.mutator.createTemplateItem).toHaveBeenCalledWith(
      ContentType.Note,
      expect.objectContaining({ noteType: NoteType.Markdown }),
      expect.anything(),
    )
  })

  it('should add tag to note if default tag is set', async () => {
    application.geDefaultEditorIdentifier = jest.fn().mockReturnValue(FeatureIdentifier.PlainEditor)

    const tag = {
      uuid: 'tag-uuid',
    } as jest.Mocked<SNTag>

    application.items.findItem = jest.fn().mockReturnValue(tag)
    application.items.addTagToNote = jest.fn()

    const controller = new NoteViewController(application, undefined, { tag: tag.uuid })
    await controller.initialize()

    expect(controller['defaultTag']).toEqual(tag)
    expect(application.items.addTagToNote).toHaveBeenCalledWith(expect.anything(), tag, expect.anything())
  })
})
