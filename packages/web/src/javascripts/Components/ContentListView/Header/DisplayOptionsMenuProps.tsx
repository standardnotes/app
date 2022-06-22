import { WebApplication } from '@/Application/Application'

export type DisplayOptionsMenuPositionProps = {
  top: number
  left: number
}

export type DisplayOptionsMenuProps = {
  application: {
    getPreference: WebApplication['getPreference']
    setPreference: WebApplication['setPreference']
  }
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  closeDisplayOptionsMenu: () => void
  isOpen: boolean
  isFilesSmartView: boolean
}
