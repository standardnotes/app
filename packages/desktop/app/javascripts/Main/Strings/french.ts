import { Strings } from './types'
import { createEnglishStrings } from './english'
import { isDev } from '../Utils/Utils'

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
    backups: {
      errorChangingDirectory(error: any): string {
        return (
          "Une erreur s'est produite lors du déplacement du dossier de " +
          'sauvegardes. Si le problème est récurrent, contactez le support ' +
          'technique (en anglais) avec les informations suivantes:\n' +
          JSON.stringify(error)
        )
      },
    },
  }
}
