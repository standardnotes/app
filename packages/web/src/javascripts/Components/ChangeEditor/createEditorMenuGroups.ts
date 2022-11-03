import { WebApplication } from '@/Application/Application'
import {
  ContentType,
  FeatureStatus,
  SNComponent,
  ComponentArea,
  FeatureDescription,
  GetFeatures,
  NoteType,
} from '@standardnotes/snjs'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { PLAIN_EDITOR_NAME } from '@/Constants/Constants'

type EditorGroup = NoteType | 'others'

const getEditorGroup = (featureDescription: FeatureDescription): EditorGroup => {
  if (featureDescription.note_type) {
    return featureDescription.note_type
  } else if (featureDescription.file_type) {
    switch (featureDescription.file_type) {
      case 'html':
        return NoteType.RichText
      case 'md':
        return NoteType.Markdown
      default:
        return 'others'
    }
  }
  return 'others'
}

export const createEditorMenuGroups = (application: WebApplication, editors: SNComponent[]) => {
  const editorItems: Record<EditorGroup, EditorMenuItem[]> = {
    'plain-text': [
      {
        name: PLAIN_EDITOR_NAME,
        isEntitled: true,
      },
    ],
    'rich-text': [],
    markdown: [],
    task: [],
    code: [],
    spreadsheet: [],
    authentication: [],
    others: [],
    blocks: [],
  }

  GetFeatures()
    .filter((feature) => feature.content_type === ContentType.Component && feature.area === ComponentArea.Editor)
    .forEach((editorFeature) => {
      const notInstalled = !editors.find((editor) => editor.identifier === editorFeature.identifier)
      const isExperimental = application.features.isExperimentalFeature(editorFeature.identifier)
      const isDeprecated = editorFeature.deprecated
      const isShowable = notInstalled && !isExperimental && !isDeprecated
      if (isShowable) {
        editorItems[getEditorGroup(editorFeature)].push({
          name: editorFeature.name as string,
          isEntitled: false,
        })
      }
    })

  editors.forEach((editor) => {
    const editorItem: EditorMenuItem = {
      name: editor.displayName,
      component: editor,
      isEntitled: application.features.getFeatureStatus(editor.identifier) === FeatureStatus.Entitled,
    }

    editorItems[getEditorGroup(editor.package_info)].push(editorItem)
  })

  const editorMenuGroups: EditorMenuGroup[] = [
    {
      icon: 'plain-text',
      iconClassName: 'text-accessory-tint-1',
      title: 'Plain text',
      items: editorItems['plain-text'],
    },
    {
      icon: 'rich-text',
      iconClassName: 'text-accessory-tint-1',
      title: 'Rich text',
      items: editorItems['rich-text'],
    },
    {
      icon: 'markdown',
      iconClassName: 'text-accessory-tint-2',
      title: 'Markdown text',
      items: editorItems.markdown,
    },
    {
      icon: 'tasks',
      iconClassName: 'text-accessory-tint-3',
      title: 'Todo',
      items: editorItems.task,
    },
    {
      icon: 'code',
      iconClassName: 'text-accessory-tint-4',
      title: 'Code',
      items: editorItems.code,
    },
    {
      icon: 'spreadsheets',
      iconClassName: 'text-accessory-tint-5',
      title: 'Spreadsheet',
      items: editorItems.spreadsheet,
    },
    {
      icon: 'authenticator',
      iconClassName: 'text-accessory-tint-6',
      title: 'Authentication',
      items: editorItems.authentication,
    },
    {
      icon: 'editor',
      iconClassName: 'text-neutral',
      title: 'Others',
      items: editorItems.others,
    },
  ]

  return editorMenuGroups
}
