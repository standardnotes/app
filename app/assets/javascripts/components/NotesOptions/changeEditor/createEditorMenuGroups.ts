import { NoteType } from '@standardnotes/features';
import { SNComponent } from '@standardnotes/snjs';
import { EditorLike, EditorMenuGroup } from '../ChangeEditorOption';

export const PLAIN_EDITOR_NAME = 'Plain Editor';

export const createEditorMenuGroups = (editors: SNComponent[]) => {
  const plainTextEditors: EditorLike[] = [
    {
      name: PLAIN_EDITOR_NAME,
    },
  ];
  const richTextEditors: SNComponent[] = [];
  const markdownEditors: SNComponent[] = [];
  const taskEditors: SNComponent[] = [];
  const codeEditors: SNComponent[] = [];
  const spreadsheetEditors: SNComponent[] = [];
  const authenticationEditors: SNComponent[] = [];
  const otherEditors: SNComponent[] = [];

  editors.forEach((editor) => {
    if (editor.package_info.note_type) {
      switch (editor.package_info.note_type) {
        case NoteType.RichText:
          richTextEditors.push(editor);
          break;
        case NoteType.Markdown:
          markdownEditors.push(editor);
          break;
        case NoteType.Task:
          taskEditors.push(editor);
          break;
        case NoteType.Code:
          codeEditors.push(editor);
          break;
        case NoteType.Spreadsheet:
          spreadsheetEditors.push(editor);
          break;
        case NoteType.Authentication:
          authenticationEditors.push(editor);
          break;
        default:
          plainTextEditors.push(editor);
          break;
      }
    } else if (editor.package_info.file_type) {
      switch (editor.package_info.file_type) {
        case 'txt':
          plainTextEditors.push(editor);
          break;
        case 'html':
          richTextEditors.push(editor);
          break;
        case 'md':
          markdownEditors.push(editor);
          break;
        default:
          otherEditors.push(editor);
          break;
      }
    } else {
      otherEditors.push(editor);
    }
  });

  const editorMenuGroups: EditorMenuGroup[] = [
    {
      icon: 'plain-text',
      iconClassName: 'color-accessory-tint-1',
      title: 'Plain text',
      items: plainTextEditors,
    },
    {
      icon: 'rich-text',
      iconClassName: 'color-accessory-tint-1',
      title: 'Rich text',
      items: richTextEditors,
    },
    {
      icon: 'markdown',
      iconClassName: 'color-accessory-tint-2',
      title: 'Markdown text',
      items: markdownEditors,
    },
    {
      icon: 'tasks',
      iconClassName: 'color-accessory-tint-3',
      title: 'Todo',
      items: taskEditors,
    },
    {
      icon: 'code',
      iconClassName: 'color-accessory-tint-4',
      title: 'Code',
      items: codeEditors,
    },
    {
      icon: 'spreadsheets',
      iconClassName: 'color-accessory-tint-5',
      title: 'Spreadsheet',
      items: spreadsheetEditors,
    },
    {
      icon: 'authenticator',
      iconClassName: 'color-accessory-tint-6',
      title: 'Authentication',
      items: authenticationEditors,
    },
    {
      icon: 'editor',
      iconClassName: 'color-neutral',
      title: 'Others',
      items: otherEditors,
    },
  ];

  return editorMenuGroups;
};
