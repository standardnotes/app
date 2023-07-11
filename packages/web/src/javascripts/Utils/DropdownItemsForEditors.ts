import { FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import {
  ComponentArea,
  EditorFeatureDescription,
  FindNativeFeature,
  GetNativeEditors,
  NoteType,
} from '@standardnotes/features'
import { PlainEditorMetadata, SuperEditorMetadata } from '@/Constants/Constants'
import { getIconAndTintForNoteType } from './Items/Icons/getIconAndTintForNoteType'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export type EditorOption = DropdownItem & {
  value: FeatureIdentifier
  isLabs?: boolean
}

export function noteTypeForEditorOptionValue(
  value: EditorOption['value'],
  application: WebApplicationInterface,
): NoteType {
  if (value === FeatureIdentifier.PlainEditor) {
    return NoteType.Plain
  } else if (value === FeatureIdentifier.SuperEditor) {
    return NoteType.Super
  }

  const nativeEditor = FindNativeFeature<EditorFeatureDescription>(value)
  if (nativeEditor) {
    return nativeEditor.note_type
  }

  const matchingEditor = application.componentManager
    .thirdPartyComponentsForArea(ComponentArea.Editor)
    .find((editor) => editor.identifier === value)

  return matchingEditor ? matchingEditor.noteType : NoteType.Unknown
}

export function getDropdownItemsForAllEditors(application: WebApplicationInterface): EditorOption[] {
  const plaintextOption: EditorOption = {
    icon: PlainEditorMetadata.icon,
    iconClassName: PlainEditorMetadata.iconClassName,
    label: PlainEditorMetadata.name,
    value: FeatureIdentifier.PlainEditor,
  }

  const options: EditorOption[] = []

  options.push(
    ...GetNativeEditors().map((editor) => {
      const [iconType, tint] = getIconAndTintForNoteType(editor.note_type)

      return {
        label: editor.name,
        value: editor.identifier,
        ...(iconType ? { icon: iconType } : null),
        ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
      }
    }),
  )

  options.push(
    ...application.componentManager
      .thirdPartyComponentsForArea(ComponentArea.Editor)
      .filter((component) => FindNativeFeature(component.identifier) === undefined)
      .map((editor): EditorOption => {
        const identifier = editor.package_info.identifier
        const [iconType, tint] = getIconAndTintForNoteType(editor.package_info.note_type)

        return {
          label: editor.displayName,
          value: identifier,
          ...(iconType ? { icon: iconType } : null),
          ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
        }
      }),
  )

  options.push(plaintextOption)

  if (application.features.getFeatureStatus(FeatureIdentifier.SuperEditor) === FeatureStatus.Entitled) {
    options.push({
      icon: SuperEditorMetadata.icon,
      iconClassName: SuperEditorMetadata.iconClassName,
      label: SuperEditorMetadata.name,
      value: FeatureIdentifier.SuperEditor,
      isLabs: true,
    })
  }

  options.sort((a, b) => {
    return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
  })

  return options
}
