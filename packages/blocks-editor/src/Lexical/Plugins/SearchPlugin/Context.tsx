import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react'
import { SuperSearchContextAction, SuperSearchContextState, SuperSearchResult } from './Types'

type SuperSearchContextData = {
  query: string
  results: SuperSearchResult[]
  currentResultIndex: number
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
      }
    case 'clear-results':
      return {
        ...state,
        results: [],
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
        currentResultIndex:
          state.currentResultIndex + 1 < state.results.length ? state.currentResultIndex + 1 : state.currentResultIndex,
      }
    case 'go-to-previous-result':
      return {
        ...state,
        currentResultIndex: state.currentResultIndex - 1 >= 0 ? state.currentResultIndex - 1 : state.currentResultIndex,
      }
    case 'reset-search':
      return { ...initialState }
  }
}

export const SuperSearchContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(searchContextReducer, initialState)
  const { query, results, currentResultIndex } = state

  const value = useMemo(
    () => ({
      query,
      results,
      currentResultIndex,
      dispatch,
    }),
    [query, results, currentResultIndex],
  )

  return <SuperSearchContext.Provider value={value}>{children}</SuperSearchContext.Provider>
}
