import {
  ComponentArea,
  ComponentPermission,
  EditorFeatureDescription,
  NoteType,
  ThemeDockIcon,
  UIFeatureDescriptionTypes,
  isEditorFeatureDescription,
  isIframeComponentFeatureDescription,
  isThemeFeatureDescription,
} from '@standardnotes/features'
import { ComponentInterface } from '../../Syncable/Component/ComponentInterface'
import { isTheme } from '../../Syncable/Theme'
import {
  isComponentOrFeatureDescriptionAComponent,
  isComponentOrFeatureDescriptionAFeatureDescription,
} from './TypeGuards'
import { UIFeatureInterface } from './UIFeatureInterface'

export class UIFeature<F extends UIFeatureDescriptionTypes> implements UIFeatureInterface<F> {
  constructor(public readonly item: ComponentInterface | F) {}

  get isComponent(): boolean {
    return isComponentOrFeatureDescriptionAComponent(this.item)
  }

  get isFeatureDescription(): boolean {
    return isComponentOrFeatureDescriptionAFeatureDescription(this.item)
  }

  get isThemeComponent(): boolean {
    return isComponentOrFeatureDescriptionAComponent(this.item) && isTheme(this.item)
  }

  get asComponent(): ComponentInterface {
    if (isComponentOrFeatureDescriptionAComponent(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to component')
  }

  get asFeatureDescription(): F {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to feature description')
  }

  get uniqueIdentifier(): string {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item.identifier
    } else {
      return this.item.uuid
    }
  }

  get featureIdentifier(): string {
    return this.item.identifier
  }

  get noteType(): NoteType {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item) && isEditorFeatureDescription(this.item)) {
      return this.item.note_type ?? NoteType.Unknown
    } else if (isComponentOrFeatureDescriptionAComponent(this.item)) {
      return this.item.noteType
    }

    throw new Error('Invalid component or feature description')
  }

  get fileType(): EditorFeatureDescription['file_type'] {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item) && isEditorFeatureDescription(this.item)) {
      return this.item.file_type
    } else if (
      isComponentOrFeatureDescriptionAComponent(this.item) &&
      isEditorFeatureDescription(this.item.package_info)
    ) {
      return this.item.package_info?.file_type ?? 'txt'
    }

    throw new Error('Invalid component or feature description')
  }

  get displayName(): string {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item.name ?? ''
    } else {
      return this.item.displayName
    }
  }

  get description(): string {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item.description ?? ''
    } else {
      return this.item.package_info.description ?? ''
    }
  }

  get deprecationMessage(): string | undefined {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item.deprecation_message
    } else {
      return this.item.deprecationMessage
    }
  }

  get expirationDate(): Date | undefined {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item.expires_at ? new Date(this.item.expires_at) : undefined
    } else {
      return this.item.valid_until
    }
  }

  get featureDescription(): F {
    if (isComponentOrFeatureDescriptionAFeatureDescription(this.item)) {
      return this.item
    } else {
      return this.item.package_info as F
    }
  }

  get acquiredPermissions(): ComponentPermission[] {
    if (
      isComponentOrFeatureDescriptionAFeatureDescription(this.item) &&
      isIframeComponentFeatureDescription(this.item)
    ) {
      return this.item.component_permissions ?? []
    } else if (isComponentOrFeatureDescriptionAComponent(this.item)) {
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
    if (isComponentOrFeatureDescriptionAComponent(this.item) && isTheme(this.item)) {
      return this.item.layerable
    } else if (isThemeFeatureDescription(this.asFeatureDescription)) {
      return this.asFeatureDescription.layerable ?? false
    }

    return false
  }

  get dockIcon(): ThemeDockIcon | undefined {
    if (isComponentOrFeatureDescriptionAComponent(this.item) && isTheme(this.item)) {
      return this.item.package_info.dock_icon
    } else if (isThemeFeatureDescription(this.asFeatureDescription)) {
      return this.asFeatureDescription.dock_icon
    }

    return undefined
  }
}
