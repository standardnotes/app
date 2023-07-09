import { WebApplication } from '@/Application/WebApplication'
import { ContentType } from '@standardnotes/common'
import {
  MutatorService,
  SNComponentManager,
  SNComponent,
  SNTag,
  SNNote,
  Deferred,
  SyncServiceInterface,
  ItemManagerInterface,
  MutatorClientInterface,
} from '@standardnotes/snjs'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { NoteViewController } from './NoteViewController'

describe('note view controller', () => {
  let application: WebApplication
  let componentManager: SNComponentManager

  beforeEach(() => {
    application = {} as jest.Mocked<WebApplication>
    application.streamItems = jest.fn().mockReturnValue(() => {})
    application.getPreference = jest.fn().mockReturnValue(true)
    application.noAccount = jest.fn().mockReturnValue(false)
    application.isNativeMobileWeb = jest.fn().mockReturnValue(false)

    const items = {} as jest.Mocked<ItemManagerInterface>
    items.createTemplateItem = jest.fn().mockReturnValue({} as SNNote)
    Object.defineProperty(application, 'items', { value: items })

    Object.defineProperty(application, 'sync', { value: {} as jest.Mocked<SyncServiceInterface> })
    application.sync.sync = jest.fn().mockReturnValue(Promise.resolve())

    componentManager = {} as jest.Mocked<SNComponentManager>
    componentManager.legacyGetDefaultEditor = jest.fn()
    Object.defineProperty(application, 'componentManager', { value: componentManager })

    const mutator = {} as jest.Mocked<MutatorClientInterface>
    Object.defineProperty(application, 'mutator', { value: mutator })
  })

  it('should create notes with plaintext note type', async () => {
    application.geDefaultEditorIdentifier = jest.fn().mockReturnValue(FeatureIdentifier.PlainEditor)

    const controller = new NoteViewController(application)
    await controller.initialize()

    expect(application.items.createTemplateItem).toHaveBeenCalledWith(
      ContentType.Note,
      expect.objectContaining({ noteType: NoteType.Plain }),
      expect.anything(),
    )
  })

  it('should create notes with markdown note type', async () => {
    componentManager.legacyGetDefaultEditor = jest.fn().mockReturnValue({
      identifier: FeatureIdentifier.MarkdownProEditor,
    } as SNComponent)

    componentManager.componentOrNativeFeatureForIdentifier = jest.fn().mockReturnValue({
      identifier: FeatureIdentifier.MarkdownProEditor,
    } as SNComponent)

    application.geDefaultEditorIdentifier = jest.fn().mockReturnValue(FeatureIdentifier.MarkdownProEditor)

    const controller = new NoteViewController(application)
    await controller.initialize()

    expect(application.items.createTemplateItem).toHaveBeenCalledWith(
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
    application.mutator.addTagToNote = jest.fn()

    const controller = new NoteViewController(application, undefined, { tag: tag.uuid })
    await controller.initialize()

    expect(controller['defaultTag']).toEqual(tag)
    expect(application.mutator.addTagToNote).toHaveBeenCalledWith(expect.anything(), tag, expect.anything())
  })

  it('should wait until item finishes saving locally before deiniting', async () => {
    const note = {
      uuid: 'note-uuid',
    } as jest.Mocked<SNNote>

    application.items.findItem = jest.fn().mockReturnValue(note)

    const controller = new NoteViewController(application, note)
    await controller.initialize()

    const changePromise = Deferred()

    application.mutator.changeItem = jest.fn().mockReturnValue(changePromise.promise)

    const savePromise = controller.saveAndAwaitLocalPropagation({ isUserModified: true, bypassDebouncer: true })
    controller.deinit()

    expect(controller.dealloced).toEqual(false)

    changePromise.resolve(true)
    await changePromise.promise
    await savePromise

    expect(controller.dealloced).toEqual(true)
  })
})
