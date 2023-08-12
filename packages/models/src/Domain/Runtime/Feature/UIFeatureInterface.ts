import {
  ComponentArea,
  ComponentPermission,
  EditorFeatureDescription,
  NativeFeatureIdentifier,
  NoteType,
  ThemeDockIcon,
  UIFeatureDescriptionTypes,
} from '@standardnotes/features'
import { ComponentInterface } from '../../Syncable/Component'
import { Uuid } from '@standardnotes/domain-core'

export interface UIFeatureInterface<F extends UIFeatureDescriptionTypes> {
  item: ComponentInterface | F
  get isComponent(): boolean
  get isThemeComponent(): boolean
  get asComponent(): ComponentInterface
  get asFeatureDescription(): F
  get isNativeFeature(): boolean
  get uniqueIdentifier(): NativeFeatureIdentifier | Uuid
  get featureIdentifier(): string
  get noteType(): NoteType
  get fileType(): EditorFeatureDescription['file_type']
  get displayName(): string
  get description(): string
  get deprecationMessage(): string | undefined
  get expirationDate(): Date | undefined
  get featureDescription(): F
  get acquiredPermissions(): ComponentPermission[]
  get area(): ComponentArea
  get layerable(): boolean
  get dockIcon(): ThemeDockIcon | undefined
}
