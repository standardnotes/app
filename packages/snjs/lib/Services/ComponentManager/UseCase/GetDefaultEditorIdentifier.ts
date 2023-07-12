import { ComponentArea, EditorIdentifier, FeatureIdentifier } from '@standardnotes/features'
import { ComponentInterface, PrefKey, SNTag } from '@standardnotes/models'
import { ItemManagerInterface, PreferenceServiceInterface } from '@standardnotes/services'

export class GetDefaultEditorIdentifierUseCase {
  constructor(private preferences: PreferenceServiceInterface, private items: ItemManagerInterface) {}

  execute(currentTag?: SNTag): EditorIdentifier {
    if (currentTag) {
      const editorIdentifier = currentTag?.preferences?.editorIdentifier
      if (editorIdentifier) {
        return editorIdentifier
      }
    }

    const preferenceValue = this.preferences.getValue(PrefKey.DefaultEditorIdentifier)
    if (preferenceValue) {
      return preferenceValue
    }

    const editors = this.thirdPartyComponentsForArea(ComponentArea.Editor)
    const matchingEditor = editors.filter((e) => e.legacyIsDefaultEditor())[0]
    if (matchingEditor) {
      return matchingEditor.identifier
    }

    return FeatureIdentifier.PlainEditor
  }

  thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[] {
    return this.items.getDisplayableComponents().filter((component) => {
      return component.area === area
    })
  }
}
