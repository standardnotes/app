import { isDev } from '../Utils/Utils'
import { createEnglishStrings } from './english'
import { Strings } from './types'

export function createFrenchStrings(): Strings {
  const fallback = createEnglishStrings()
  if (!isDev()) {
    /**
     * Le Français est une langue expérimentale.
     * Don't show it in production yet.
     */
    return fallback
  }
  return {
    appMenu: {
      ...fallback.appMenu,
      edit: 'Édition',
      view: 'Affichage',
    },
    contextMenu: {
      learnSpelling: "Mémoriser l'orthographe",
      noSuggestions: 'Aucune suggestion',
    },
    tray: {
      show: 'Afficher',
      hide: 'Masquer',
      quit: 'Quitter',
    },
    extensions: fallback.extensions,
    updates: fallback.updates,
  }
}
