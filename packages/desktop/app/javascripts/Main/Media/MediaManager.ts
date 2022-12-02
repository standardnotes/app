import { MediaManagerInterface } from './MediaManagerInterface'

const { systemPreferences } = require('electron')

export class MediaManager implements MediaManagerInterface {
  async askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean> {
    const permission = systemPreferences.getMediaAccessStatus(type)

    if (permission === 'granted') {
      return true
    } else if (permission === 'denied') {
      return false
    }

    const granted = await systemPreferences.askForMediaAccess(type)
    return granted
  }
}
