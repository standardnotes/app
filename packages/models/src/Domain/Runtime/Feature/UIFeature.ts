import {
  ComponentArea,
  ComponentPermission,
  EditorFeatureDescription,
  FindNativeFeature,
  NativeFeatureIdentifier,
  NoteType,
  ThemeDockIcon,
  UIFeatureDescriptionTypes,
  isEditorFeatureDescription,
  isIframeComponentFeatureDescription,
  isThemeFeatureDescription,
} from '@standardnotes/features'
import { ComponentInterface } from '../../Syncable/Component/ComponentInterface'
import { isItemBasedFeature, isNativeFeature } from './TypeGuards'
import { UIFeatureInterface } from './UIFeatureInterface'
import { Uuid } from '@standardnotes/domain-core'
import { ThemePackageInfo, isTheme } from '../../Syncable/Component'

export class UIFeature<F extends UIFeatureDescriptionTypes> implements UIFeatureInterface<F> {
  constructor(public readonly item: ComponentInterface | F) {}

  get isComponent(): boolean {
    return isItemBasedFeature(this.item)
  }

  get isThemeComponent(): boolean {
    return isItemBasedFeature(this.item) && isTheme(this.item)
  }

  get asComponent(): ComponentInterface {
    if (isItemBasedFeature(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to component')
  }

  get asTheme(): ComponentInterface<ThemePackageInfo> {
    if (isItemBasedFeature(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to component')
  }

  get asFeatureDescription(): F {
    if (isNativeFeature(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to feature description')
  }

  get isNativeFeature(): boolean {
    return FindNativeFeature(this.featureIdentifier) !== undefined
  }

  get uniqueIdentifier(): NativeFeatureIdentifier | Uuid {
    if (isNativeFeature(this.item)) {
      const nativeFeature = NativeFeatureIdentifier.create(this.item.identifier)
      return nativeFeature.getValue()
    } else {
      return Uuid.create(this.item.uuid).getValue()
    }
  }

  get featureIdentifier(): string {
    return this.item.identifier
  }

  get noteType(): NoteType {
    if (isNativeFeature(this.item) && isEditorFeatureDescription(this.item)) {
      return this.item.note_type ?? NoteType.Unknown
    } else if (isItemBasedFeature(this.item)) {
      return this.item.noteType
    }

    throw new Error('Invalid component or feature description')
  }

  get fileType(): EditorFeatureDescription['file_type'] {
    if (isNativeFeature(this.item) && isEditorFeatureDescription(this.item)) {
      return this.item.file_type
    } else if (isItemBasedFeature(this.item) && isEditorFeatureDescription(this.item.package_info)) {
      return this.item.package_info?.file_type ?? 'txt'
    }

    throw new Error('Invalid component or feature description')
  }

  get displayName(): string {
    if (isNativeFeature(this.item)) {
      return this.item.name ?? ''
    } else {
      return this.item.displayName
    }
  }

  get description(): string {
    if (isNativeFeature(this.item)) {
      return this.item.description ?? ''
    } else {
      return this.item.package_info.description ?? ''
    }
  }

  get deprecationMessage(): string | undefined {
    if (isNativeFeature(this.item)) {
      return this.item.deprecation_message
    } else {
      return this.item.deprecationMessage
    }
  }

  get expirationDate(): Date | undefined {
    if (isNativeFeature(this.item)) {
      return this.item.expires_at ? new Date(this.item.expires_at) : undefined
    } else {
      return this.item.valid_until
    }
  }

  get featureDescription(): F {
    if (isNativeFeature(this.item)) {
      return this.item
    } else {
      return this.item.package_info as F
    }
  }

  get acquiredPermissions(): ComponentPermission[] {
    if (isNativeFeature(this.item) && isIframeComponentFeatureDescription(this.item)) {
      return this.item.component_permissions ?? []
    } else if (isItemBasedFeature(this.item)) {
      return this.item.permissions
    }

    throw new Error('Invalid component or feature description')
  }

  get area(): ComponentArea {
    if ('area' in this.item) {
      return this.item.area
    }

    return ComponentArea.Editor
  }

  get layerable(): boolean {
    if (isItemBasedFeature(this.item) && isTheme(this.item)) {
      return this.item.layerableTheme
    } else if (isThemeFeatureDescription(this.asFeatureDescription)) {
      return this.asFeatureDescription.layerable ?? false
    }

    return false
  }

  get dockIcon(): ThemeDockIcon | undefined {
    if (isItemBasedFeature(this.item) && isTheme(this.item)) {
      return this.asTheme.package_info.dock_icon
    } else if (isThemeFeatureDescription(this.asFeatureDescription)) {
      return this.asFeatureDescription.dock_icon
    }

    return undefined
  }
}
