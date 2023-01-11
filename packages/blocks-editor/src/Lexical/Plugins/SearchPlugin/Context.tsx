import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react'
import { SuperSearchContextAction, SuperSearchContextState } from './Types'

type SuperSearchContextData = SuperSearchContextState & {
  dispatch: React.Dispatch<SuperSearchContextAction>
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
    case 'set-case-sensitive':
      return {
        ...state,
        isCaseSensitive: action.isCaseSensitive,
      }
    case 'go-to-next-result':
      return {
        ...state,
        currentResultIndex: state.currentResultIndex + 1 < state.results.length ? state.currentResultIndex + 1 : 0,
      }
    case 'go-to-previous-result':
      return {
        ...state,
        currentResultIndex: state.currentResultIndex - 1 >= 0 ? state.currentResultIndex - 1 : state.results.length - 1,
      }
    case 'reset-search':
      return { ...initialState }
  }
}

export const SuperSearchContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(searchContextReducer, initialState)
  const { query, results, currentResultIndex, isCaseSensitive } = state

  const value = useMemo(
    () => ({
      query,
      results,
      currentResultIndex,
      isCaseSensitive,
      dispatch,
    }),
    [query, results, currentResultIndex, isCaseSensitive],
  )

  return <SuperSearchContext.Provider value={value}>{children}</SuperSearchContext.Provider>
}
