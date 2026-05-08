import { UniversalSearchProvider } from '../types'

export const NoOpUniversalSearchProvider: UniversalSearchProvider = {
  id: 'noop',
  capabilities: {
    supportsSearch: false,
    supportsReplace: false,
    supportsHighlightAll: false,
  },
  search: () => [],
  selectResult: () => {
    return
  },
  clear: () => {
    return
  },
}
