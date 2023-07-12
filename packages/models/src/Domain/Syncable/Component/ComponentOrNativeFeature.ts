import {
  AnyFeatureDescription,
  ComponentArea,
  ComponentPermission,
  EditorFeatureDescription,
  FeatureIdentifier,
  IframeComponentFeatureDescription,
  NoteType,
  ThemeDockIcon,
  UIFeatureDescriptionTypes,
  isEditorFeatureDescription,
  isIframeComponentFeatureDescription,
  isThemeFeatureDescription,
} from '@standardnotes/features'
import { ComponentInterface } from './ComponentInterface'
import { ThemeInterface, isTheme } from '../Theme'

function isComponent(x: ComponentInterface | UIFeatureDescriptionTypes): x is ComponentInterface {
  return 'uuid' in x
}

function isFeatureDescription(x: ComponentInterface | AnyFeatureDescription): x is AnyFeatureDescription {
  return !('uuid' in x)
}

export function isIframeUIFeature(
  x: ComponentOrNativeFeature<EditorFeatureDescription | IframeComponentFeatureDescription>,
): x is ComponentOrNativeFeature<IframeComponentFeatureDescription> {
  return isIframeComponentFeatureDescription(x.featureDescription)
}

export class ComponentOrNativeFeature<F extends UIFeatureDescriptionTypes> {
  constructor(public readonly item: ComponentInterface | F) {}

  get isComponent(): boolean {
    return isComponent(this.item)
  }

  get isFeatureDescription(): boolean {
    return isFeatureDescription(this.item)
  }

  get isThemeComponent(): boolean {
    return isComponent(this.item) && isTheme(this.item)
  }

  get asComponent(): ComponentInterface {
    if (isComponent(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to component')
  }

  get asTheme(): ThemeInterface {
    if (isComponent(this.item) && isTheme(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to theme')
  }

  get asFeatureDescription(): F {
    if (isFeatureDescription(this.item)) {
      return this.item
    }

    throw new Error('Cannot cast item to feature description')
  }

  get uniqueIdentifier(): string {
    if (isFeatureDescription(this.item)) {
      return this.item.identifier
    } else {
      return this.item.uuid
    }
  }

  get featureIdentifier(): FeatureIdentifier {
    return this.item.identifier
  }

  get noteType(): NoteType {
    if (isFeatureDescription(this.item) && isEditorFeatureDescription(this.item)) {
      return this.item.note_type ?? NoteType.Unknown
    } else if (isComponent(this.item)) {
      return this.item.noteType
    }

    throw new Error('Invalid component or feature description')
  }

  get fileType(): EditorFeatureDescription['file_type'] {
    if (isFeatureDescription(this.item) && isEditorFeatureDescription(this.item)) {
      return this.item.file_type
    } else if (isComponent(this.item) && isEditorFeatureDescription(this.item.package_info)) {
      return this.item.package_info?.file_type ?? 'txt'
    }

    throw new Error('Invalid component or feature description')
  }

  get displayName(): string {
    if (isFeatureDescription(this.item)) {
      return this.item.name ?? ''
    } else {
      return this.item.displayName
    }
  }

  get description(): string {
    if (isFeatureDescription(this.item)) {
      return this.item.description ?? ''
    } else {
      return this.item.package_info.description ?? ''
    }
  }

  get deprecationMessage(): string | undefined {
    if (isFeatureDescription(this.item)) {
      return this.item.deprecation_message
    } else {
      return this.item.deprecationMessage
    }
  }

  get expirationDate(): Date | undefined {
    if (isFeatureDescription(this.item)) {
      return this.item.expires_at ? new Date(this.item.expires_at) : undefined
    } else {
      return this.item.valid_until
    }
  }

  get featureDescription(): F {
    if (isFeatureDescription(this.item)) {
      return this.item
    } else {
      return this.item.package_info as F
    }
  }

  get acquiredPermissions(): ComponentPermission[] {
    if (isFeatureDescription(this.item) && isIframeComponentFeatureDescription(this.item)) {
      return this.item.component_permissions ?? []
    } else if (isComponent(this.item)) {
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
    if (this.isThemeComponent) {
      return this.asTheme.layerable
    } else if (isThemeFeatureDescription(this.asFeatureDescription)) {
      return this.asFeatureDescription.layerable ?? false
    }

    return false
  }

  get dockIcon(): ThemeDockIcon | undefined {
    if (this.isThemeComponent) {
      return this.asTheme.package_info.dock_icon
    } else if (isThemeFeatureDescription(this.asFeatureDescription)) {
      return this.asFeatureDescription.dock_icon
    }

    return undefined
  }
}
