import { WebApplication } from '@/Application/WebApplication'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { PaneController } from '@/Controllers/PaneController/PaneController'

export type DisplayOptionsMenuPositionProps = {
  top: number
  left: number
}

export type DisplayOptionsMenuProps = {
  application: WebApplication
  selectedTag: AnyTag
  isFilesSmartView: boolean
  paneController: PaneController
}
