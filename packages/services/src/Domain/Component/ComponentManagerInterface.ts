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
  UIFeature,
  PermissionDialog,
  SNNote,
} from '@standardnotes/models'

import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { ComponentViewerInterface } from './ComponentViewerInterface'

export interface ComponentManagerInterface {
  urlForComponent(uiFeature: UIFeature<ComponentFeatureDescription>): string | undefined
  setDesktopManager(desktopManager: DesktopManagerInterface): void
  thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[]
  editorForNote(note: SNNote): UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>
  doesEditorChangeRequireAlert(
    from: UIFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
    to: UIFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
  ): boolean
  showEditorChangeAlert(): Promise<boolean>
  destroyComponentViewer(viewer: ComponentViewerInterface): void
  createComponentViewer(
    uiFeature: UIFeature<IframeComponentFeatureDescription>,
    item: ComponentViewerItem,
    actionObserver?: ActionObserver,
    urlOverride?: string,
  ): ComponentViewerInterface
  presentPermissionsDialog(_dialog: PermissionDialog): void
  legacyGetDefaultEditor(): ComponentInterface | undefined

  isThemeActive(theme: UIFeature<ThemeFeatureDescription>): boolean
  toggleTheme(theme: UIFeature<ThemeFeatureDescription>): Promise<void>
  getActiveThemes(): UIFeature<ThemeFeatureDescription>[]
  getActiveThemesIdentifiers(): string[]

  isComponentActive(component: ComponentInterface): boolean
  toggleComponent(component: ComponentInterface): Promise<void>
}
