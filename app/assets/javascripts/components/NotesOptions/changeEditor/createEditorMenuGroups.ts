import {
  ComponentArea,
  FeatureDescription,
  Features,
  NoteType,
} from '@standardnotes/features';
import { ContentType, SNComponent } from '@standardnotes/snjs';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';

/** @todo Implement interchangeable alert */

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
  } else {
    return 'others';
  }
};

export const createEditorMenuGroups = (editors: SNComponent[]) => {
  const editorItems: Record<EditorGroup, EditorMenuItem[]> = {
    plain: [
      {
        name: PLAIN_EDITOR_NAME,
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

  Features.filter(
    (feature) =>
      feature.content_type === ContentType.Component &&
      feature.area === ComponentArea.Editor
  ).forEach((editorFeature) => {
    if (
      !editors.find((editor) => editor.identifier === editorFeature.identifier)
    ) {
      editorItems[getEditorGroup(editorFeature)].push({
        name: editorFeature.name as string,
        isPremiumFeature: true,
      });
    }
  });

  editors.forEach((editor) => {
    const editorItem: EditorMenuItem = {
      name: editor.name,
      component: editor,
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
