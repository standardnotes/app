import { KeyboardService, UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE } from '@standardnotes/ui-services'
import { UniversalSearchController } from './UniversalSearchController'
import { registerUniversalSearchKeyboardHandlers } from './registerUniversalSearchKeyboardHandlers'
import { createMockUniversalSearchProvider } from './providers/createMockUniversalSearchProvider'

type CapturedKeyboardHandler = {
  command: unknown
  onKeyDown?: (event: KeyboardEvent) => void
}

describe('registerUniversalSearchKeyboardHandlers', () => {
  function createKeyboardEvent(): KeyboardEvent {
    return {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as KeyboardEvent
  }

  function createCapturingKeyboardService() {
    const handlers: CapturedKeyboardHandler[] = []

    return {
      handlers,
      keyboardService: {
        addCommandHandlers: (newHandlers: CapturedKeyboardHandler[]) => {
          handlers.push(...newHandlers)
          return () => undefined
        },
      } as unknown as KeyboardService,
    }
  }

  it('opens search in replace mode when the replace shortcut is used while closed', () => {
    const { keyboardService, handlers } = createCapturingKeyboardService()
    const controller = new UniversalSearchController(createMockUniversalSearchProvider({ documents: [] }), {
      searchDebounceMs: 0,
      contentSearchDebounceMs: 0,
    })

    registerUniversalSearchKeyboardHandlers(keyboardService, controller, { locked: false })

    const handler = handlers.find((entry) => entry.command === UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE)
    handler?.onKeyDown?.(createKeyboardEvent())

    expect(controller.isOpen).toBe(true)
    expect(controller.isReplaceMode).toBe(true)
  })

  it('does not open replace mode when the editor is locked', () => {
    const { keyboardService, handlers } = createCapturingKeyboardService()
    const controller = new UniversalSearchController(createMockUniversalSearchProvider({ documents: [] }), {
      searchDebounceMs: 0,
      contentSearchDebounceMs: 0,
    })

    registerUniversalSearchKeyboardHandlers(keyboardService, controller, { locked: true })

    const handler = handlers.find((entry) => entry.command === UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE)
    handler?.onKeyDown?.(createKeyboardEvent())

    expect(controller.isOpen).toBe(false)
    expect(controller.isReplaceMode).toBe(false)
  })
})
