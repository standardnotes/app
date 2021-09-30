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

const getEditorIconType = (name: string): IconType | null => {
  switch (name) {
    case 'Bold Editor':
    case 'Plus Editor':
      return 'rich-text';
    case 'TokenVault':
      return 'authenticator';
    case 'Secure Spreadsheets':
      return 'spreadsheets';
    case 'Task Editor':
      return 'tasks';
    case 'Code Editor':
      return 'code';
  }
  if (name.includes('Markdown')) {
    return 'markdown';
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
        const iconType = getEditorIconType(editor.name);

        return {
          label: editor.name,
          value: editor.package_info.identifier,
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
