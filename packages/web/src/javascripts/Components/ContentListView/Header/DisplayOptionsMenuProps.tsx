import { WebApplication } from '@/Application/Application'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { PaneController } from '@/Controllers/PaneController/PaneController'

export type DisplayOptionsMenuPositionProps = {
  top: number
  left: number
}

export type DisplayOptionsMenuProps = {
  application: WebApplication
  selectedTag: AnyTag
  isOpen: boolean
  isFilesSmartView: boolean
  paneController: PaneController
}
