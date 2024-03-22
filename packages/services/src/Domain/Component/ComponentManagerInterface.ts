import { ComponentViewerItem } from './ComponentViewerItem'
import {
  ComponentArea,
  ComponentFeatureDescription,
  EditorFeatureDescription,
  IframeComponentFeatureDescription,
  NativeFeatureIdentifier,
  ThemeFeatureDescription,
} from '@standardnotes/features'
import { ActionObserver, ComponentInterface, UIFeature, PermissionDialog, SNNote, SNTag } from '@standardnotes/models'
import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { ComponentViewerInterface } from './ComponentViewerInterface'
import { Uuid } from '@standardnotes/domain-core'

export interface ComponentManagerInterface {
  urlForFeature(uiFeature: UIFeature<ComponentFeatureDescription>): string | undefined
  setDesktopManager(desktopManager: DesktopManagerInterface): void
  thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[]
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

  setPermissionDialogUIHandler(handler: (dialog: PermissionDialog) => void): void

  findComponentWithPackageIdentifier(identifier: string): ComponentInterface | undefined
  editorForNote(note: SNNote): UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>
  getDefaultEditorIdentifier(currentTag?: SNTag): string

  isThemeActive(theme: UIFeature<ThemeFeatureDescription>): boolean
  toggleTheme(theme: UIFeature<ThemeFeatureDescription>, skipEntitlementCheck?: boolean): Promise<void>
  toggleOtherNonLayerableThemes(uiFeature: UIFeature<ThemeFeatureDescription>): void
  getActiveThemes(): UIFeature<ThemeFeatureDescription>[]
  getActiveThemesIdentifiers(): { features: NativeFeatureIdentifier[]; uuids: Uuid[] }

  isComponentActive(component: ComponentInterface): boolean
  toggleComponent(component: ComponentInterface): Promise<void>
}
