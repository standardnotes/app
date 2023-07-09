import {
  FeatureStatus,
  FeatureDescription,
  FindNativeFeature,
  NoteType,
  FeatureIdentifier,
  ComponentInterface,
  GetNativeEditors,
  ComponentArea,
} from '@standardnotes/snjs'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { PlainEditorMetadata, SuperEditorMetadata } from '@/Constants/Constants'
import { WebApplicationInterface } from '@standardnotes/ui-services'

type NoteTypeToEditorRowsMap = Record<NoteType, EditorMenuItem[]>

const getNoteTypeForFeatureDescription = (featureDescription: FeatureDescription): NoteType => {
  if (featureDescription.note_type) {
    return featureDescription.note_type
  } else if (featureDescription.file_type) {
    switch (featureDescription.file_type) {
      case 'html':
        return NoteType.RichText
      case 'md':
        return NoteType.Markdown
    }
  }
  return NoteType.Unknown
}

const insertNativeEditorsInMap = (
  map: NoteTypeToEditorRowsMap,
  installedEditors: ComponentInterface[],
  application: WebApplicationInterface,
): void => {
  for (const editorFeature of GetNativeEditors()) {
    const hasLegacyInstallation =
      installedEditors.find((editor) => editor.identifier === editorFeature.identifier) != undefined
    if (hasLegacyInstallation) {
      continue
    }

    const isExperimental = application.features.isExperimentalFeature(editorFeature.identifier)
    if (isExperimental) {
      continue
    }

    const isDeprecated = editorFeature.deprecated
    if (isDeprecated) {
      continue
    }

    const noteType = getNoteTypeForFeatureDescription(editorFeature)
    map[noteType].push({
      name: editorFeature.name as string,
      isEntitled: application.features.getFeatureStatus(editorFeature.identifier) === FeatureStatus.Entitled,
      noteType,
    })
  }
}

const insertInstalledComponentsInMap = (
  map: NoteTypeToEditorRowsMap,
  editors: ComponentInterface[],
  application: WebApplicationInterface,
) => {
  editors.forEach((editor) => {
    const noteType = editor.noteType

    const editorItem: EditorMenuItem = {
      name: editor.displayName,
      component: editor,
      isEntitled: application.features.getFeatureStatus(editor.identifier) === FeatureStatus.Entitled,
      noteType,
    }

    map[noteType].push(editorItem)
  })
}

const createGroupsFromMap = (map: NoteTypeToEditorRowsMap): EditorMenuGroup[] => {
  const groups: EditorMenuGroup[] = [
    {
      icon: 'plain-text',
      iconClassName: 'text-accessory-tint-1',
      title: 'Plain text',
      items: map[NoteType.Plain],
    },
    {
      icon: SuperEditorMetadata.icon,
      iconClassName: SuperEditorMetadata.iconClassName,
      title: SuperEditorMetadata.name,
      items: map[NoteType.Super],
      featured: true,
    },
    {
      icon: 'rich-text',
      iconClassName: 'text-accessory-tint-1',
      title: 'Rich text',
      items: map[NoteType.RichText],
    },
    {
      icon: 'markdown',
      iconClassName: 'text-accessory-tint-2',
      title: 'Markdown text',
      items: map[NoteType.Markdown],
    },
    {
      icon: 'tasks',
      iconClassName: 'text-accessory-tint-3',
      title: 'Todo',
      items: map[NoteType.Task],
    },
    {
      icon: 'code',
      iconClassName: 'text-accessory-tint-4',
      title: 'Code',
      items: map[NoteType.Code],
    },
    {
      icon: 'spreadsheets',
      iconClassName: 'text-accessory-tint-5',
      title: 'Spreadsheet',
      items: map[NoteType.Spreadsheet],
    },
    {
      icon: 'authenticator',
      iconClassName: 'text-accessory-tint-6',
      title: 'Authentication',
      items: map[NoteType.Authentication],
    },
    {
      icon: 'editor',
      iconClassName: 'text-neutral',
      title: 'Others',
      items: map[NoteType.Unknown],
    },
  ]

  return groups
}

const createBaselineMap = (application: WebApplicationInterface): NoteTypeToEditorRowsMap => {
  const map: NoteTypeToEditorRowsMap = {
    [NoteType.Plain]: [
      {
        name: PlainEditorMetadata.name,
        isEntitled: true,
        noteType: NoteType.Plain,
      },
    ],
    [NoteType.Super]: [
      {
        name: SuperEditorMetadata.name,
        isEntitled: application.features.getFeatureStatus(FeatureIdentifier.SuperEditor) === FeatureStatus.Entitled,
        noteType: NoteType.Super,
        description: FindNativeFeature(FeatureIdentifier.SuperEditor)?.description,
      },
    ],
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

export const createEditorMenuGroups = (application: WebApplicationInterface) => {
  const map = createBaselineMap(application)

  const thirdPartyOrInstalledEditors = application.componentManager
    .thirdPartyComponentsForArea(ComponentArea.Editor)
    .sort((a, b) => {
      return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
    })

  insertNativeEditorsInMap(map, thirdPartyOrInstalledEditors, application)

  insertInstalledComponentsInMap(map, thirdPartyOrInstalledEditors, application)

  return createGroupsFromMap(map)
}
