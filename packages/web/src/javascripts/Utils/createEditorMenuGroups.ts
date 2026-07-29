import {
  FeatureStatus,
  FindNativeFeature,
  NoteType,
  GetIframeAndNativeEditors,
  ComponentArea,
  GetSuperNoteFeature,
  UIFeature,
  IframeComponentFeatureDescription,
  Uuid,
  NativeFeatureIdentifier,
} from '@standardnotes/snjs'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { SuperEditorMetadata } from '@/Constants/Constants'
import { WebApplicationInterface } from '@standardnotes/ui-services'
import {
  AuthenticatorName,
  ChecklistEditorName,
  CodeEditorName,
  jtString,
  MarkdownEditorName,
  RichTextEditorName,
  SpreadsheetName,
} from '@standardnotes/features'
import { c } from 'ttag'

type NoteTypeToEditorRowsMap = Record<NoteType, EditorMenuItem[]>

const insertNativeEditorsInMap = (map: NoteTypeToEditorRowsMap, application: WebApplicationInterface): void => {
  for (const editorFeature of GetIframeAndNativeEditors()) {
    const isExperimental = application.features.isExperimentalFeature(editorFeature.identifier)
    if (isExperimental) {
      continue
    }

    if (editorFeature.deprecated) {
      continue
    }

    const noteType = editorFeature.note_type
    map[noteType].push({
      isEntitled:
        application.features.getFeatureStatus(NativeFeatureIdentifier.create(editorFeature.identifier).getValue()) ===
        FeatureStatus.Entitled,
      uiFeature: new UIFeature(editorFeature),
    })
  }
}

const insertInstalledComponentsInMap = (map: NoteTypeToEditorRowsMap, application: WebApplicationInterface) => {
  const thirdPartyOrInstalledEditors = application.componentManager
    .thirdPartyComponentsForArea(ComponentArea.Editor)
    .sort((a, b) => {
      return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
    })

  for (const editor of thirdPartyOrInstalledEditors) {
    const nativeFeature = FindNativeFeature(editor.identifier) as IframeComponentFeatureDescription

    if (nativeFeature) {
      map[nativeFeature.note_type].push({
        isEntitled:
          application.features.getFeatureStatus(NativeFeatureIdentifier.create(nativeFeature.identifier).getValue()) ===
          FeatureStatus.Entitled,
        uiFeature: new UIFeature(nativeFeature),
      })

      continue
    }

    const noteType = editor.noteType

    const editorItem: EditorMenuItem = {
      uiFeature: new UIFeature<IframeComponentFeatureDescription>(editor),
      isEntitled: application.features.getFeatureStatus(Uuid.create(editor.uuid).getValue()) === FeatureStatus.Entitled,
    }

    map[noteType].push(editorItem)
  }
}

const createGroupsFromMap = (map: NoteTypeToEditorRowsMap): EditorMenuGroup[] => {
  const superNote = GetSuperNoteFeature()
  const groups: EditorMenuGroup[] = [
    {
      icon: SuperEditorMetadata.icon,
      iconClassName: SuperEditorMetadata.iconClassName,
      title: superNote.name,
      items: map[NoteType.Super],
      featured: true,
    },
    {
      icon: 'rich-text',
      iconClassName: 'text-accessory-tint-1',
      title: RichTextEditorName,
      items: map[NoteType.RichText],
    },
    {
      icon: 'markdown',
      iconClassName: 'text-accessory-tint-2',
      title: jtString(c('B4.Notes.EditingUI.Label').jt`${MarkdownEditorName} text`),
      items: map[NoteType.Markdown],
    },
    {
      icon: 'tasks',
      iconClassName: 'text-accessory-tint-3',
      title: ChecklistEditorName,
      items: map[NoteType.Task],
    },
    {
      icon: 'code',
      iconClassName: 'text-accessory-tint-4',
      title: CodeEditorName,
      items: map[NoteType.Code],
    },
    {
      icon: 'spreadsheets',
      iconClassName: 'text-accessory-tint-5',
      title: SpreadsheetName,
      items: map[NoteType.Spreadsheet],
    },
    {
      icon: 'authenticator',
      iconClassName: 'text-accessory-tint-6',
      title: AuthenticatorName,
      items: map[NoteType.Authentication],
    },
    {
      icon: 'plain-text',
      iconClassName: 'text-accessory-tint-1',
      title: c('B4.Notes.EditingUI.Label').t`Plain text`,
      items: map[NoteType.Plain],
    },
    {
      icon: 'editor',
      iconClassName: 'text-neutral',
      title: c('B4.Notes.EditingUI.Label').t`Others`,
      items: map[NoteType.Unknown],
    },
  ]

  return groups
}

const createBaselineMap = (): NoteTypeToEditorRowsMap => {
  const map: NoteTypeToEditorRowsMap = {
    [NoteType.Plain]: [],
    [NoteType.Super]: [],
    [NoteType.RichText]: [],
    [NoteType.Markdown]: [],
    [NoteType.Task]: [],
    [NoteType.Code]: [],
    [NoteType.Spreadsheet]: [],
    [NoteType.Authentication]: [],
    [NoteType.Unknown]: [],
  }

  return map
}

export const createEditorMenuGroups = (application: WebApplicationInterface): EditorMenuGroup[] => {
  const map = createBaselineMap()

  insertNativeEditorsInMap(map, application)

  insertInstalledComponentsInMap(map, application)

  return createGroupsFromMap(map)
}
