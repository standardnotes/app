import {
  KeyboardService,
  UNIVERSAL_SEARCH_NEXT_RESULT,
  UNIVERSAL_SEARCH_PREVIOUS_RESULT,
  UNIVERSAL_SEARCH_TOGGLE_CASE_SENSITIVE,
  UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE,
  UNIVERSAL_TOGGLE_SEARCH,
} from '@standardnotes/ui-services'
import { Disposer } from '@/Types/Disposer'
import { UniversalSearchController } from './UniversalSearchController'

type RegisterUniversalSearchKeyboardHandlersOptions = {
  locked: boolean
}

export function registerUniversalSearchKeyboardHandlers<TPayload>(
  keyboardService: KeyboardService,
  controller: UniversalSearchController<TPayload>,
  { locked }: RegisterUniversalSearchKeyboardHandlersOptions,
): Disposer {
  return keyboardService.addCommandHandlers([
    {
      command: UNIVERSAL_TOGGLE_SEARCH,
      category: 'Search',
      description: 'Search in current note',
      onKeyDown: (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (controller.isOpen) {
          controller.close()
        } else {
          controller.open()
        }
      },
    },
    {
      command: UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE,
      category: 'Search',
      description: 'Search and replace in current note',
      onKeyDown: (event) => {
        if (locked) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        if (!controller.isOpen) {
          controller.open()
          if (!controller.isReplaceMode) {
            controller.toggleReplaceMode()
          }
          return
        }

        controller.toggleReplaceMode()
      },
    },
    {
      command: UNIVERSAL_SEARCH_TOGGLE_CASE_SENSITIVE,
      onKeyDown: () => {
        if (!controller.isOpen) {
          return
        }

        controller.toggleCaseSensitivity()
      },
    },
    {
      command: UNIVERSAL_SEARCH_NEXT_RESULT,
      category: 'Search',
      description: 'Go to next search result',
      onKeyDown(event) {
        if (!controller.isOpen) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        controller.goToNextResult()
      },
    },
    {
      command: UNIVERSAL_SEARCH_PREVIOUS_RESULT,
      category: 'Search',
      description: 'Go to previous search result',
      onKeyDown(event) {
        if (!controller.isOpen) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        controller.goToPreviousResult()
      },
    },
  ])
}
