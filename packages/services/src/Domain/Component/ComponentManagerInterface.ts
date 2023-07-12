import { ComponentViewerItem } from './ComponentViewerItem'
import {
  ComponentArea,
  ComponentFeatureDescription,
  EditorFeatureDescription,
  IframeComponentFeatureDescription,
  ThemeFeatureDescription,
} from '@standardnotes/features'
import {
  ActionObserver,
  ComponentInterface,
  ComponentOrNativeFeature,
  PermissionDialog,
  SNNote,
} from '@standardnotes/models'

import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { ComponentViewerInterface } from './ComponentViewerInterface'

export interface ComponentManagerInterface {
  urlForComponent(uiFeature: ComponentOrNativeFeature<ComponentFeatureDescription>): string | undefined
  setDesktopManager(desktopManager: DesktopManagerInterface): void
  thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[]
  editorForNote(note: SNNote): ComponentOrNativeFeature<EditorFeatureDescription | IframeComponentFeatureDescription>
  doesEditorChangeRequireAlert(
    from: ComponentOrNativeFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
    to: ComponentOrNativeFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
  ): boolean
  showEditorChangeAlert(): Promise<boolean>
  destroyComponentViewer(viewer: ComponentViewerInterface): void
  createComponentViewer(
    uiFeature: ComponentOrNativeFeature<IframeComponentFeatureDescription>,
    item: ComponentViewerItem,
    actionObserver?: ActionObserver,
    urlOverride?: string,
  ): ComponentViewerInterface
  presentPermissionsDialog(_dialog: PermissionDialog): void
  legacyGetDefaultEditor(): ComponentInterface | undefined

  isThemeActive(theme: ComponentOrNativeFeature<ThemeFeatureDescription>): boolean
  toggleTheme(theme: ComponentOrNativeFeature<ThemeFeatureDescription>): Promise<void>
  getActiveThemes(): ComponentOrNativeFeature<ThemeFeatureDescription>[]
  getActiveThemesIdentifiers(): string[]

  isComponentActive(component: ComponentInterface): boolean
  toggleComponent(component: ComponentInterface): Promise<void>
}
