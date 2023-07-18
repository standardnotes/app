import { WebDevice } from '@standardnotes/web/src/javascripts/Application/Device/WebDevice'
import { ExtensionDevice } from './device'

declare global {
  interface Window {
    extensionDevice?: WebDevice
  }
}

window.extensionDevice = new ExtensionDevice('1.0.0')
