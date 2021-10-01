import { Dropdown, DropdownItem } from '@/components/Dropdown';
import { IconType } from '@/components/Icon';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import {
  ComponentArea,
  ComponentMutator,
  SNComponent,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

type Props = {
  application: WebApplication;
};

enum EditorIdentifier {
  PlainEditor = 'plain-editor',
  BoldEditor = 'org.standardnotes.bold-editor',
  CodeEditor = 'org.standardnotes.code-editor',
  MarkdownBasic = 'org.standardnotes.simple-markdown-editor',
  MarkdownMath = 'org.standardnotes.fancy-markdown-editor',
  MarkdownMinimist = 'org.standardnotes.minimal-markdown-editor',
  MarkdownPro = 'org.standardnotes.advanced-markdown-editor',
  PlusEditor = 'org.standardnotes.plus-editor',
  SecureSpreadsheets = 'org.standardnotes.standard-sheets',
  TaskEditor = 'org.standardnotes.simple-task-editor',
  TokenVault = 'org.standardnotes.token-vault',
}

const getEditorIconType = (identifier: string): IconType | null => {
  switch (identifier) {
    case EditorIdentifier.BoldEditor:
    case EditorIdentifier.PlusEditor:
      return 'rich-text';
    case EditorIdentifier.MarkdownBasic:
    case EditorIdentifier.MarkdownMath:
    case EditorIdentifier.MarkdownMinimist:
    case EditorIdentifier.MarkdownPro:
      return 'markdown';
    case EditorIdentifier.TokenVault:
      return 'authenticator';
    case EditorIdentifier.SecureSpreadsheets:
      return 'spreadsheets';
    case EditorIdentifier.TaskEditor:
      return 'tasks';
    case EditorIdentifier.CodeEditor:
      return 'code';
  }
  return null;
};

const makeEditorDefault = (
  application: WebApplication,
  component: SNComponent,
  currentDefault: SNComponent
) => {
  if (currentDefault) {
    application.changeItem(currentDefault.uuid, (m) => {
      const mutator = m as ComponentMutator;
      mutator.defaultEditor = false;
    });
  }
  application.changeAndSaveItem(component.uuid, (m) => {
    const mutator = m as ComponentMutator;
    mutator.defaultEditor = true;
  });
};

const removeEditorDefault = (
  application: WebApplication,
  component: SNComponent
) => {
  application.changeAndSaveItem(component.uuid, (m) => {
    const mutator = m as ComponentMutator;
    mutator.defaultEditor = false;
  });
};

const getDefaultEditor = (application: WebApplication) => {
  return application.componentManager
    .componentsForArea(ComponentArea.Editor)
    .filter((e) => e.isDefaultEditor())[0];
};

export const Defaults: FunctionComponent<Props> = ({ application }) => {
  const [editorItems, setEditorItems] = useState<DropdownItem[]>([]);
  const [defaultEditorValue] = useState(
    () =>
      getDefaultEditor(application)?.package_info?.identifier || 'plain-editor'
  );

  useEffect(() => {
    const editors = application.componentManager
      .componentsForArea(ComponentArea.Editor)
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      })
      .map((editor) => {
        const identifier = editor.package_info.identifier;
        const iconType = getEditorIconType(identifier);

        return {
          label: editor.name,
          value: identifier,
          ...(iconType ? { icon: iconType } : null),
        };
      });

    setEditorItems([
      {
        icon: 'plain-text',
        label: 'Plain Editor',
        value: 'plain-editor',
      },
      ...editors,
    ]);
  }, [application]);

  const setDefaultEditor = (value: string) => {
    const editors = application.componentManager.componentsForArea(
      ComponentArea.Editor
    );
    const currentDefault = getDefaultEditor(application);

    if (value !== 'plain-editor') {
      const editorComponent = editors.filter(
        (e) => e.package_info.identifier === value
      )[0];
      makeEditorDefault(application, editorComponent, currentDefault);
    } else {
      removeEditorDefault(application, currentDefault);
    }
  };

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Defaults</Title>
        <div className="mt-2">
          <Subtitle>Default Editor</Subtitle>
          <Text>New notes will be created using this editor.</Text>
          <div className="mt-2">
            <Dropdown
              id="def-editor-dropdown"
              srLabel="Select the default editor"
              items={editorItems}
              defaultValue={defaultEditorValue}
              onChange={setDefaultEditor}
            />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
