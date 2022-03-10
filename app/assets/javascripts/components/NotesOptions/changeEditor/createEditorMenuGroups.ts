import { WebApplication } from '@/ui_models/application';
import {
  ComponentArea,
  FeatureDescription,
  GetFeatures,
  NoteType,
} from '@standardnotes/features';
import { ContentType, FeatureStatus, SNComponent } from '@standardnotes/snjs';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';

export const PLAIN_EDITOR_NAME = 'Plain Editor';

type EditorGroup = NoteType | 'plain' | 'others';

const getEditorGroup = (
  featureDescription: FeatureDescription
): EditorGroup => {
  if (featureDescription.note_type) {
    return featureDescription.note_type;
  } else if (featureDescription.file_type) {
    switch (featureDescription.file_type) {
      case 'txt':
        return 'plain';
      case 'html':
        return NoteType.RichText;
      case 'md':
        return NoteType.Markdown;
      default:
        return 'others';
    }
  }
  return 'others';
};

export const createEditorMenuGroups = (
  application: WebApplication,
  editors: SNComponent[]
) => {
  const editorItems: Record<EditorGroup, EditorMenuItem[]> = {
    plain: [
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
  };

  GetFeatures()
    .filter(
      (feature) =>
        feature.content_type === ContentType.Component &&
        feature.area === ComponentArea.Editor
    )
    .forEach((editorFeature) => {
      const notInstalled = !editors.find(
        (editor) => editor.identifier === editorFeature.identifier
      );
      const isExperimental = application.features.isExperimentalFeature(
        editorFeature.identifier
      );
      if (notInstalled && !isExperimental) {
        editorItems[getEditorGroup(editorFeature)].push({
          name: editorFeature.name as string,
          isEntitled: false,
        });
      }
    });

  editors.forEach((editor) => {
    const editorItem: EditorMenuItem = {
      name: editor.name,
      component: editor,
      isEntitled:
        application.features.getFeatureStatus(editor.identifier) ===
        FeatureStatus.Entitled,
    };

    editorItems[getEditorGroup(editor.package_info)].push(editorItem);
  });

  const editorMenuGroups: EditorMenuGroup[] = [
    {
      icon: 'plain-text',
      iconClassName: 'color-accessory-tint-1',
      title: 'Plain text',
      items: editorItems.plain,
    },
    {
      icon: 'rich-text',
      iconClassName: 'color-accessory-tint-1',
      title: 'Rich text',
      items: editorItems['rich-text'],
    },
    {
      icon: 'markdown',
      iconClassName: 'color-accessory-tint-2',
      title: 'Markdown text',
      items: editorItems.markdown,
    },
    {
      icon: 'tasks',
      iconClassName: 'color-accessory-tint-3',
      title: 'Todo',
      items: editorItems.task,
    },
    {
      icon: 'code',
      iconClassName: 'color-accessory-tint-4',
      title: 'Code',
      items: editorItems.code,
    },
    {
      icon: 'spreadsheets',
      iconClassName: 'color-accessory-tint-5',
      title: 'Spreadsheet',
      items: editorItems.spreadsheet,
    },
    {
      icon: 'authenticator',
      iconClassName: 'color-accessory-tint-6',
      title: 'Authentication',
      items: editorItems.authentication,
    },
    {
      icon: 'editor',
      iconClassName: 'color-neutral',
      title: 'Others',
      items: editorItems.others,
    },
  ];

  return editorMenuGroups;
};
