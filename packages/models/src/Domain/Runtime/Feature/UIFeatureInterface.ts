import {
  ComponentArea,
  ComponentPermission,
  EditorFeatureDescription,
  FeatureIdentifier,
  NoteType,
  ThemeDockIcon,
  UIFeatureDescriptionTypes,
} from '@standardnotes/features'
import { ComponentInterface } from '../../Syncable/Component'

export interface UIFeatureInterface<F extends UIFeatureDescriptionTypes> {
  item: ComponentInterface | F
  get isComponent(): boolean
  get isFeatureDescription(): boolean
  get isThemeComponent(): boolean
  get asComponent(): ComponentInterface
  get asFeatureDescription(): F
  get uniqueIdentifier(): string
  get featureIdentifier(): FeatureIdentifier
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
