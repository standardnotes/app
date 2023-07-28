import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { ComponentArea, NativeFeatureIdentifier } from '@standardnotes/features'
import { ComponentInterface, PrefKey, SNTag } from '@standardnotes/models'
import { ItemManagerInterface, PreferenceServiceInterface } from '@standardnotes/services'

export class GetDefaultEditorIdentifier implements SyncUseCaseInterface<string> {
  constructor(
    private preferences: PreferenceServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  execute(currentTag?: SNTag): Result<string> {
    if (currentTag) {
      const editorIdentifier = currentTag?.preferences?.editorIdentifier
      if (editorIdentifier) {
        return Result.ok(editorIdentifier)
      }
    }

    const preferenceValue = this.preferences.getValue(PrefKey.DefaultEditorIdentifier)
    if (preferenceValue) {
      return Result.ok(preferenceValue)
    }

    const editors = this.thirdPartyComponentsForArea(ComponentArea.Editor)
    const matchingEditor = editors.filter((e) => e.legacyIsDefaultEditor())[0]
    if (matchingEditor) {
      return Result.ok(matchingEditor.identifier)
    }

    return Result.ok(NativeFeatureIdentifier.TYPES.PlainEditor)
  }

  thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[] {
    return this.items.getDisplayableComponents().filter((component) => {
      return component.area === area
    })
  }
}
