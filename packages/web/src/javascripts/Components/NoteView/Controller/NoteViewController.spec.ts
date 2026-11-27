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
  InternalFeature,
  InternalFeatureService,
  MutationType,
  NoteMutator,
  PayloadEmitSource,
  PrefKey,
} from '@standardnotes/snjs'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { NoteViewController } from './NoteViewController'

type FakeMutator = Pick<NoteMutator, 'setLastCaret'> & { text?: string; lastCaretOffset?: number }

const createFakeMutator = (): FakeMutator => ({
  setLastCaret(offset) {
    this.lastCaretOffset = offset
  },
})

describe('note view controller', () => {
  let application: WebApplication
  let componentManager: ComponentManager

  beforeAll(() => {
    InternalFeatureService.get().enableFeature(InternalFeature.RestoreEditorPosition)
  })

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

  describe('caret capture', () => {
    let mutated: FakeMutator
    let changeItem: jest.Mock
    let controller: NoteViewController
    let note: SNNote
    let emitNoteChange: (note: SNNote) => void

    const setRestoreEditorPositionPreference = (enabled: boolean) => {
      application.preferences.getValue = jest.fn((key: PrefKey) =>
        key === PrefKey.RestoreEditorPosition ? enabled : true,
      )
    }

    beforeEach(async () => {
      mutated = createFakeMutator()
      changeItem = jest.fn(async (_note, callback) => callback(mutated))
      note = { uuid: 'uuid', text: '' } as SNNote

      application.items.streamItems = jest.fn().mockImplementation((_contentType, callback) => {
        emitNoteChange = (changed) =>
          callback({ changed: [changed], inserted: [], source: PayloadEmitSource.LocalChanged })
        return () => undefined
      })
      application.items.findItem = jest.fn().mockImplementation(() => note)
      application.mutator.changeItem = changeItem

      controller = new NoteViewController(
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
      controller.registerCaretReader(() => 7)
    })

    it('saves the caret together with the content', async () => {
      await controller.saveAndAwaitLocalPropagation({ text: 'hi', bypassDebouncer: true })

      expect(changeItem).toHaveBeenCalledTimes(1)
      expect(mutated).toMatchObject({ text: 'hi', lastCaretOffset: 7 })
    })

    it('does not save the caret when the preference is off', async () => {
      setRestoreEditorPositionPreference(false)

      await controller.saveAndAwaitLocalPropagation({ text: 'hi', bypassDebouncer: true })

      expect(mutated.lastCaretOffset).toBeUndefined()
    })

    it('saves only the caret, without updating timestamps, when closed', async () => {
      controller.deinit()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(changeItem.mock.calls[0][2]).toBe(MutationType.NoUpdateUserTimestamps)
      expect(mutated).toMatchObject({ lastCaretOffset: 7 })
      expect(mutated.text).toBeUndefined()
      expect(controller.dealloced).toBe(true)
    })

    it('does not write the caret again when closing right after a content save stored it', async () => {
      changeItem.mockImplementation(async (_note, callback) => {
        const changes = createFakeMutator()
        callback(changes)
        note = { ...note, lastCaretOffset: changes.lastCaretOffset } as SNNote
        emitNoteChange(note)
      })

      const save = controller.saveAndAwaitLocalPropagation({ text: 'hi', bypassDebouncer: true })
      controller.deinit()
      await save
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(changeItem).toHaveBeenCalledTimes(1)
      expect(controller.dealloced).toBe(true)
    })

    it('skips the caret-only save when the stored caret is unchanged', async () => {
      controller.item = { ...note, lastCaretOffset: 7 } as SNNote

      await controller.persistCaret()

      expect(changeItem).not.toHaveBeenCalled()
    })

    it('deinits synchronously when there is no caret and no pending save', () => {
      setRestoreEditorPositionPreference(false)

      controller.deinit()

      expect(controller.dealloced).toBe(true)
    })

    it('does not write a caret once the editor reader is disposed', async () => {
      const dispose = controller.registerCaretReader(() => 12)
      dispose()

      await controller.persistCaret()

      expect(changeItem).not.toHaveBeenCalled()
    })

    it('does not let an old reader disposer unregister a newer reader', async () => {
      const disposeOldReader = controller.registerCaretReader(() => 3)
      controller.registerCaretReader(() => 9)
      disposeOldReader()

      await controller.persistCaret()

      expect(mutated).toMatchObject({ lastCaretOffset: 9 })
    })
  })
})
