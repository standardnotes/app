import { FeatureIdentifier } from '@standardnotes/snjs'
import { ComponentArea, NoteType } from '@standardnotes/features'
import { WebApplication } from '@/Application/Application'
import { PlainEditorMetadata, SuperEditorMetadata } from '@/Constants/Constants'
import { getIconAndTintForNoteType } from './Items/Icons/getIconAndTintForNoteType'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'

export type EditorOption = DropdownItem & {
  value: FeatureIdentifier
}

export function noteTypeForEditorOptionValue(value: EditorOption['value'], application: WebApplication): NoteType {
  if (value === FeatureIdentifier.PlainEditor) {
    return NoteType.Plain
  } else if (value === FeatureIdentifier.SuperEditor) {
    return NoteType.Super
  }

  const matchingEditor = application.componentManager
    .componentsForArea(ComponentArea.Editor)
    .find((editor) => editor.identifier === value)

  return matchingEditor ? matchingEditor.noteType : NoteType.Unknown
}

export function getDropdownItemsForAllEditors(application: WebApplication): EditorOption[] {
  const plaintextOption: EditorOption = {
    icon: PlainEditorMetadata.icon,
    iconClassName: PlainEditorMetadata.iconClassName,
    label: PlainEditorMetadata.name,
    value: FeatureIdentifier.PlainEditor,
  }

  const options = application.componentManager.componentsForArea(ComponentArea.Editor).map((editor): EditorOption => {
    const identifier = editor.package_info.identifier
    const [iconType, tint] = getIconAndTintForNoteType(editor.package_info.note_type)

    return {
      label: editor.displayName,
      value: identifier,
      ...(iconType ? { icon: iconType } : null),
      ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
    }
  })

  options.push(plaintextOption)

  if (application.features.isExperimentalFeatureEnabled(FeatureIdentifier.SuperEditor)) {
    options.push({
      icon: SuperEditorMetadata.icon,
      iconClassName: SuperEditorMetadata.iconClassName,
      label: SuperEditorMetadata.name,
      value: FeatureIdentifier.SuperEditor,
    })
  }

  options.sort((a, b) => {
    return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
  })

  return options
}
