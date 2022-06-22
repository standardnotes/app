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
  closeDisplayOptionsMenu: () => void
  isOpen: boolean
  isFilesSmartView: boolean
}
