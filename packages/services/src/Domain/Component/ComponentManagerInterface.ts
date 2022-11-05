import { Uuid } from '@standardnotes/common'
import { ComponentArea, FeatureIdentifier } from '@standardnotes/features'
import { ActionObserver, PermissionDialog, SNComponent, SNNote } from '@standardnotes/models'

import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { ComponentViewerInterface } from './ComponentViewerInterface'

export interface ComponentManagerInterface {
  urlForComponent(component: SNComponent): string | undefined
  setDesktopManager(desktopManager: DesktopManagerInterface): void
  componentsForArea(area: ComponentArea): SNComponent[]
  editorForNote(note: SNNote): SNComponent | undefined
  doesEditorChangeRequireAlert(from: SNComponent | undefined, to: SNComponent | undefined): boolean
  showEditorChangeAlert(): Promise<boolean>
  destroyComponentViewer(viewer: ComponentViewerInterface): void
  createComponentViewer(
    component: SNComponent,
    contextItem?: Uuid,
    actionObserver?: ActionObserver,
    urlOverride?: string,
  ): ComponentViewerInterface
  createBlockComponentViewer(
    component: SNComponent,
    noteId: string,
    blockId: string,
    actionObserver?: ActionObserver,
  ): ComponentViewerInterface
  presentPermissionsDialog(_dialog: PermissionDialog): void
  getDefaultEditor(): SNComponent | undefined
  componentWithIdentifier(identifier: FeatureIdentifier | string): SNComponent | undefined
}
