import { ComponentAction, IframeComponentFeatureDescription } from '@standardnotes/features'
import {
  ComponentMessage,
  DecryptedPayload,
  Environment,
  FillItemContent,
  NoteContent,
  Platform,
  PayloadTimestampDefaults,
  SNNote,
  UIFeature,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'
import { UuidGenerator } from '@standardnotes/utils'
import { ComponentViewer } from './ComponentViewer'
import { ComponentViewerRequiresComponentManagerProperties } from './ComponentViewerRequiresComponentManagerFunctions'

const createNote = (content: Partial<NoteContent>) =>
  new SNNote(
    new DecryptedPayload({
      uuid: 'note-uuid',
      content_type: ContentType.TYPES.Note,
      content: FillItemContent<NoteContent>(content),
      ...PayloadTimestampDefaults(),
    }),
  )

describe('ComponentViewer caret', () => {
  const createViewer = () => {
    const services = {
      items: { addObserver: jest.fn().mockReturnValue(jest.fn()) },
      features: { addEventObserver: jest.fn().mockReturnValue(jest.fn()) },
      logger: { info: jest.fn() },
      alerts: { alert: jest.fn() },
    }

    const viewer = new ComponentViewer(
      {
        displayName: 'Editor',
        uniqueIdentifier: { value: 'editor' },
      } as unknown as UIFeature<IframeComponentFeatureDescription>,
      services as unknown as ConstructorParameters<typeof ComponentViewer>[1],
      { item: { uuid: 'note-uuid' } as unknown as SNNote, url: 'https://editor' },
      {
        environment: Environment.Web,
        platform: Platform.MacWeb,
        componentManagerFunctions: {} as ComponentViewerRequiresComponentManagerProperties,
      },
    )

    return { viewer, services }
  }

  const caretOffsetMessage = (data: ComponentMessage['data']): ComponentMessage => ({
    action: ComponentAction.CaretOffset,
    data,
  })

  const register = (viewer: ComponentViewer) => {
    UuidGenerator.SetGenerator(() => 'session-key')
    ;(viewer as unknown as { config: { componentManagerFunctions: object } }).config.componentManagerFunctions = {
      getComponentPreferences: () => undefined,
      urlsForActiveThemes: () => [],
    }
    const postMessage = jest.fn()
    viewer.setWindow({ postMessage } as unknown as Window)

    return postMessage.mock.calls.find(([message]) => message.action === ComponentAction.ComponentRegistered)[0].data
  }

  it('has no caret offset until the component reports one', () => {
    const { viewer } = createViewer()

    expect(viewer.getCaretOffset()).toBeUndefined()
  })

  it('keeps the latest caret offset reported by the component', () => {
    const { viewer } = createViewer()

    viewer.handleMessage(caretOffsetMessage({ caretOffset: 4 }))
    viewer.handleMessage(caretOffsetMessage({ caretOffset: 9 }))

    expect(viewer.getCaretOffset()).toBe(9)
  })

  it('ignores malformed caret offset messages', () => {
    const { viewer } = createViewer()
    viewer.handleMessage(caretOffsetMessage({ caretOffset: 4 }))

    viewer.handleMessage(caretOffsetMessage({}))
    viewer.handleMessage(caretOffsetMessage({ caretOffset: '7' as unknown as number }))

    expect(viewer.getCaretOffset()).toBe(4)
  })

  it('asks the component to restore the caret on registration', () => {
    const { viewer } = createViewer()
    viewer.setCaretRestoration(() => ({ offset: 12 }))

    expect(register(viewer)).toEqual(expect.objectContaining({ restoreCaret: true, caretOffset: 12 }))
  })

  it('asks the component to only focus when there is no caret to restore', () => {
    const { viewer } = createViewer()
    viewer.setCaretRestoration(() => ({}))

    const data = register(viewer)

    expect(data.restoreCaret).toBe(true)
    expect(data.caretOffset).toBeUndefined()
  })

  it('does not ask the component to restore the caret unless the host wants it', () => {
    const { viewer } = createViewer()
    viewer.setCaretRestoration(() => undefined)

    expect(register(viewer).restoreCaret).toBeUndefined()
  })

  describe('context item updates', () => {
    type Internals = {
      streamContextItemOriginalMessage?: ComponentMessage
      sendContextItemThroughBridge: (item: SNNote) => void
      handleChangesInItems: (items: SNNote[], source: number) => void
      options: { item: SNNote }
    }

    const setup = (note: SNNote) => {
      const { viewer } = createViewer()
      const internals = viewer as unknown as Internals
      internals.options = { item: note }
      internals.streamContextItemOriginalMessage = { action: ComponentAction.StreamContextItem, data: {} }
      const send = jest.fn((item: SNNote) => {
        ;(internals as unknown as { lastContextItem?: SNNote }).lastContextItem = item
      })
      internals.sendContextItemThroughBridge = send

      return { internals, send }
    }

    const withContent = (note: SNNote, content: Record<string, unknown>) =>
      new SNNote(note.payload.copy({ content: { ...note.content, ...content } } as never))

    it('does not send the note again when only the caret changed', () => {
      const note = createNote({ text: 'hello' })
      const { internals, send } = setup(note)
      internals.sendContextItemThroughBridge(note)
      send.mockClear()

      internals.handleChangesInItems([withContent(note, { lastCaretOffset: 3, lastCaretAt: 1 })], 0)

      expect(send).not.toHaveBeenCalled()
    })

    it('sends the note when its text changed', () => {
      const note = createNote({ text: 'hello' })
      const { internals, send } = setup(note)
      internals.sendContextItemThroughBridge(note)
      send.mockClear()

      internals.handleChangesInItems([withContent(note, { text: 'hello world', lastCaretOffset: 3 })], 0)

      expect(send).toHaveBeenCalledTimes(1)
    })
  })
})
