import {
  ComponentArea,
  EditorFeatureDescription,
  FindNativeFeature,
  GetIframeAndNativeEditors,
  GetPlainNoteFeature,
  GetSuperNoteFeature,
  IframeComponentFeatureDescription,
  NoteType,
} from '@standardnotes/features'
import { ComponentInterface, SNNote, UIFeature } from '@standardnotes/models'
import { ItemManagerInterface } from '@standardnotes/services'

export class EditorForNoteUseCase {
  constructor(private items: ItemManagerInterface) {}

  execute(note: SNNote): UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription> {
    if (note.noteType === NoteType.Plain) {
      return new UIFeature(GetPlainNoteFeature())
    }

    if (note.noteType === NoteType.Super) {
      return new UIFeature(GetSuperNoteFeature())
    }

    if (note.editorIdentifier) {
      const result = this.componentOrNativeFeatureForIdentifier(note.editorIdentifier)
      if (result) {
        return result
      }
    }

    if (note.noteType && note.noteType !== NoteType.Unknown) {
      const result = this.nativeEditorForNoteType(note.noteType)
      if (result) {
        return new UIFeature(result)
      }
    }

    const legacyResult = this.legacyGetEditorForNote(note)
    if (legacyResult) {
      return new UIFeature<IframeComponentFeatureDescription>(legacyResult)
    }

    return new UIFeature(GetPlainNoteFeature())
  }

  private componentOrNativeFeatureForIdentifier(
    identifier: string,
  ): UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription> | undefined {
    const nativeFeature = FindNativeFeature<EditorFeatureDescription | IframeComponentFeatureDescription>(identifier)
    if (nativeFeature) {
      return new UIFeature(nativeFeature)
    }

    const component = this.items.getDisplayableComponents().find((component) => {
      return component.identifier === identifier
    })
    if (component) {
      return new UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>(component)
    }

    return undefined
  }

  private nativeEditorForNoteType(noteType: NoteType): EditorFeatureDescription | undefined {
    const nativeEditors = GetIframeAndNativeEditors()
    return nativeEditors.find((editor) => editor.note_type === noteType)
  }

  /** Uses legacy approach of note/editor association. New method uses note.editorIdentifier and note.noteType directly. */
  private legacyGetEditorForNote(note: SNNote): ComponentInterface | undefined {
    const editors = this.thirdPartyComponentsForArea(ComponentArea.Editor)
    for (const editor of editors) {
      if (editor.isExplicitlyEnabledForItem(note.uuid)) {
        return editor
      }
    }

    const defaultEditor = this.legacyGetDefaultEditor()

    if (defaultEditor && !defaultEditor.isExplicitlyDisabledForItem(note.uuid)) {
      return defaultEditor
    } else {
      return undefined
    }
  }

  private legacyGetDefaultEditor(): ComponentInterface | undefined {
    const editors = this.thirdPartyComponentsForArea(ComponentArea.Editor)
    return editors.filter((e) => e.legacyIsDefaultEditor())[0]
  }

  private thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[] {
    return this.items.getDisplayableComponents().filter((component) => {
      return component.area === area
    })
  }
}
