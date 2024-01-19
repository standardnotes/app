import { WebApplication } from '@/Application/WebApplication'
import { ContentType } from '@standardnotes/domain-core'
import {
  ComponentManager,
  ComponentItem,
  SNTag,
  SNNote,
  Deferred,
  SyncServiceInterface,
  ItemManagerInterface,
  MutatorClientInterface,
  PreferenceServiceInterface,
} from '@standardnotes/snjs'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { NoteViewController } from './NoteViewController'

describe('note view controller', () => {
  let application: WebApplication
  let componentManager: ComponentManager

  beforeEach(() => {
    application = {
      preferences: {
        getValue: jest.fn().mockReturnValue(true),
      } as unknown as jest.Mocked<PreferenceServiceInterface>,
      items: {
        streamItems: jest.fn().mockReturnValue(() => {}),
        createTemplateItem: jest.fn().mockReturnValue({} as SNNote),
      } as unknown as jest.Mocked<ItemManagerInterface>,
      mutator: {} as jest.Mocked<MutatorClientInterface>,
      sessions: {
        isSignedIn: jest.fn().mockReturnValue(true),
      },
    } as unknown as jest.Mocked<WebApplication>

    application.isNativeMobileWeb = jest.fn().mockReturnValue(false)

    Object.defineProperty(application, 'sync', { value: {} as jest.Mocked<SyncServiceInterface> })
    application.sync.sync = jest.fn().mockReturnValue(Promise.resolve())

    componentManager = {} as jest.Mocked<ComponentManager>
    Object.defineProperty(application, 'componentManager', { value: componentManager })
  })

  it('should create notes with plaintext note type', async () => {
    application.componentManager.getDefaultEditorIdentifier = jest
      .fn()
      .mockReturnValue(NativeFeatureIdentifier.TYPES.PlainEditor)

    const controller = new NoteViewController(
      undefined,
      application.items,
      application.mutator,
      application.sync,
      application.sessions,
      application.preferences,
      application.componentManager,
      application.alerts,
      application.isNativeMobileWebUseCase,
    )
    await controller.initialize()

    expect(application.items.createTemplateItem).toHaveBeenCalledWith(
      ContentType.TYPES.Note,
      expect.objectContaining({ noteType: NoteType.Plain }),
      expect.anything(),
    )
  })

  it('should create notes with markdown note type', async () => {
    application.items.getDisplayableComponents = jest.fn().mockReturnValue([
      {
        identifier: NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor,
      } as ComponentItem,
    ])

    application.componentManager.getDefaultEditorIdentifier = jest
      .fn()
      .mockReturnValue(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor)

    const controller = new NoteViewController(
      undefined,
      application.items,
      application.mutator,
      application.sync,
      application.sessions,
      application.preferences,
      application.componentManager,
      application.alerts,
      application.isNativeMobileWebUseCase,
    )
    await controller.initialize()

    expect(application.items.createTemplateItem).toHaveBeenCalledWith(
      ContentType.TYPES.Note,
      expect.objectContaining({ noteType: NoteType.Markdown }),
      expect.anything(),
    )
  })

  it('should add tag to note if default tag is set', async () => {
    application.componentManager.getDefaultEditorIdentifier = jest
      .fn()
      .mockReturnValue(NativeFeatureIdentifier.TYPES.PlainEditor)

    const tag = {
      uuid: 'tag-uuid',
    } as jest.Mocked<SNTag>

    application.items.findItem = jest.fn().mockReturnValue(tag)
    application.mutator.addTagToNote = jest.fn()

    const controller = new NoteViewController(
      undefined,
      application.items,
      application.mutator,
      application.sync,
      application.sessions,
      application.preferences,
      application.componentManager,
      application.alerts,
      application.isNativeMobileWebUseCase,
      { tag: tag.uuid },
    )
    await controller.initialize()

    expect(controller['defaultTag']).toEqual(tag)
    expect(application.mutator.addTagToNote).toHaveBeenCalledWith(expect.anything(), tag, expect.anything())
  })

  it('should wait until item finishes saving locally before deiniting', async () => {
    const note = {
      uuid: 'note-uuid',
    } as jest.Mocked<SNNote>

    application.items.findItem = jest.fn().mockReturnValue(note)

    const controller = new NoteViewController(
      note,
      application.items,
      application.mutator,
      application.sync,
      application.sessions,
      application.preferences,
      application.componentManager,
      application.alerts,
      application.isNativeMobileWebUseCase,
    )
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
