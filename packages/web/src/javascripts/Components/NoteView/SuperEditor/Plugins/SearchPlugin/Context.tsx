import { createContext, ReactNode, useCallback, useContext, useMemo, useReducer, useRef } from 'react'
import { SuperSearchContextAction, SuperSearchContextState, SuperSearchReplaceEvent } from './Types'

type SuperSearchContextData = SuperSearchContextState & {
  dispatch: React.Dispatch<SuperSearchContextAction>
  addReplaceEventListener: (listener: (type: SuperSearchReplaceEvent) => void) => () => void
  dispatchReplaceEvent: (type: SuperSearchReplaceEvent) => void
}

const SuperSearchContext = createContext<SuperSearchContextData | undefined>(undefined)

export const useSuperSearchContext = () => {
  const context = useContext(SuperSearchContext)

  if (!context) {
    throw new Error('useSuperSearchContext must be used within a SuperSearchContextProvider')
  }

  return context
}

const initialState: SuperSearchContextState = {
  query: '',
  results: [],
  currentResultIndex: -1,
  isCaseSensitive: false,
  isSearchActive: false,
  isReplaceMode: false,
}

const searchContextReducer = (
  state: SuperSearchContextState,
  action: SuperSearchContextAction,
): SuperSearchContextState => {
  switch (action.type) {
    case 'set-query':
      return {
        ...state,
        query: action.query,
      }
    case 'set-results':
      return {
        ...state,
        results: action.results,
        currentResultIndex: action.results.length > 0 ? 0 : -1,
      }
    case 'clear-results':
      return {
        ...state,
        results: [],
        currentResultIndex: -1,
      }
    case 'set-current-result-index':
      return {
        ...state,
        currentResultIndex: action.index,
      }
    case 'toggle-search':
      return {
        ...initialState,
        isSearchActive: !state.isSearchActive,
      }
    case 'toggle-case-sensitive':
      return {
        ...state,
        isCaseSensitive: !state.isCaseSensitive,
      }
    case 'toggle-replace-mode': {
      const toggledValue = !state.isReplaceMode

      return {
        ...state,
        isSearchActive: toggledValue && !state.isSearchActive ? true : state.isSearchActive,
        isReplaceMode: toggledValue,
      }
    }
    case 'go-to-next-result':
      return {
        ...state,
        currentResultIndex:
          state.results.length < 1
            ? -1
            : state.currentResultIndex + 1 < state.results.length
            ? state.currentResultIndex + 1
            : 0,
      }
    case 'go-to-previous-result':
      return {
        ...state,
        currentResultIndex:
          state.results.length < 1
            ? -1
            : state.currentResultIndex - 1 >= 0
            ? state.currentResultIndex - 1
            : state.results.length - 1,
      }
    case 'reset-search':
      return { ...initialState }
  }
}

export const SuperSearchContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(searchContextReducer, initialState)

  const replaceEventListeners = useRef(new Set<(type: SuperSearchReplaceEvent) => void>())

  const addReplaceEventListener = useCallback((listener: (type: SuperSearchReplaceEvent) => void) => {
    replaceEventListeners.current.add(listener)

    return () => {
      replaceEventListeners.current.delete(listener)
    }
  }, [])

  const dispatchReplaceEvent = useCallback((type: SuperSearchReplaceEvent) => {
    replaceEventListeners.current.forEach((listener) => listener(type))
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      addReplaceEventListener,
      dispatchReplaceEvent,
    }),
    [addReplaceEventListener, dispatchReplaceEvent, state],
  )

  return <SuperSearchContext.Provider value={value}>{children}</SuperSearchContext.Provider>
}
