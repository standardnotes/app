import { ComponentViewerItem } from './ComponentViewerItem'
import { ComponentArea, FeatureIdentifier } from '@standardnotes/features'
import {
  ActionObserver,
  ComponentInterface,
  ComponentOrNativeFeature,
  ComponentOrNativeTheme,
  PermissionDialog,
  SNNote,
} from '@standardnotes/models'

import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { ComponentViewerInterface } from './ComponentViewerInterface'

export interface ComponentManagerInterface {
  urlForComponent(component: ComponentInterface): string | undefined
  setDesktopManager(desktopManager: DesktopManagerInterface): void
  componentsForArea(area: ComponentArea): ComponentInterface[]
  editorForNote(note: SNNote): ComponentOrNativeFeature | undefined
  doesEditorChangeRequireAlert(
    from: ComponentOrNativeFeature | undefined,
    to: ComponentOrNativeFeature | undefined,
  ): boolean
  showEditorChangeAlert(): Promise<boolean>
  destroyComponentViewer(viewer: ComponentViewerInterface): void
  createComponentViewer(
    component: ComponentOrNativeFeature,
    item: ComponentViewerItem,
    actionObserver?: ActionObserver,
    urlOverride?: string,
  ): ComponentViewerInterface
  presentPermissionsDialog(_dialog: PermissionDialog): void
  legacyGetDefaultEditor(): ComponentInterface | undefined
  componentWithIdentifier(identifier: FeatureIdentifier | string): ComponentOrNativeFeature | undefined

  isThemeActive(theme: ComponentOrNativeTheme): boolean
  toggleTheme(theme: ComponentOrNativeTheme): Promise<void>
  getActiveThemes(): ComponentOrNativeTheme[]
  getActiveThemesIdentifiers(): string[]

  isComponentActive(component: ComponentInterface): boolean
  toggleComponent(component: ComponentInterface): Promise<void>
}
