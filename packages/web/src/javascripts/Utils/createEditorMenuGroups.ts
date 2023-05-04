import { WebApplication } from '@/Application/WebApplication'
import {
  ContentType,
  FeatureStatus,
  SNComponent,
  ComponentArea,
  FeatureDescription,
  GetFeatures,
  FindNativeFeature,
  NoteType,
  FeatureIdentifier,
} from '@standardnotes/snjs'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { PlainEditorMetadata, SuperEditorMetadata } from '@/Constants/Constants'

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

const insertNonInstalledNativeComponentsInMap = (
  map: NoteTypeToEditorRowsMap,
  components: SNComponent[],
  application: WebApplication,
): void => {
  GetFeatures()
    .filter((feature) => feature.content_type === ContentType.Component && feature.area === ComponentArea.Editor)
    .forEach((editorFeature) => {
      const notInstalled = !components.find((editor) => editor.identifier === editorFeature.identifier)
      const isExperimental = application.features.isExperimentalFeature(editorFeature.identifier)
      const isDeprecated = editorFeature.deprecated
      const isShowable = notInstalled && !isExperimental && !isDeprecated

      if (isShowable) {
        const noteType = getNoteTypeForFeatureDescription(editorFeature)
        map[noteType].push({
          name: editorFeature.name as string,
          isEntitled: false,
          noteType,
        })
      }
    })
}

const insertInstalledComponentsInMap = (
  map: NoteTypeToEditorRowsMap,
  components: SNComponent[],
  application: WebApplication,
) => {
  components.forEach((editor) => {
    const noteType = getNoteTypeForFeatureDescription(editor.package_info)

    const editorItem: EditorMenuItem = {
      name: editor.displayName,
      component: editor,
      isEntitled: application.features.getFeatureStatus(editor.identifier) === FeatureStatus.Entitled,
      noteType,
    }

    map[noteType].push(editorItem)
  })
}

const createGroupsFromMap = (map: NoteTypeToEditorRowsMap, _application: WebApplication): EditorMenuGroup[] => {
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

const createBaselineMap = (application: WebApplication): NoteTypeToEditorRowsMap => {
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
        isLabs: true,
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

export const createEditorMenuGroups = (application: WebApplication, components: SNComponent[]) => {
  const map = createBaselineMap(application)

  insertNonInstalledNativeComponentsInMap(map, components, application)

  insertInstalledComponentsInMap(map, components, application)

  return createGroupsFromMap(map, application)
}
