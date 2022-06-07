import { WebContents } from 'electron'
import { SearchManagerInterface } from './SearchManagerInterface'

export function initializeSearchManager(webContents: WebContents): SearchManagerInterface {
  return {
    findInPage(text: string) {
      webContents.stopFindInPage('clearSelection')
      if (text && text.length > 0) {
        // This option arrangement is required to avoid an issue where clicking on a
        // different note causes scroll to jump.
        webContents.findInPage(text)
      }
    },
  }
}
