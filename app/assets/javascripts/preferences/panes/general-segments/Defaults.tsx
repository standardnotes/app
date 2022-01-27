import { Dropdown, DropdownItem } from '@/components/Dropdown';
import { FeatureIdentifier } from '@standardnotes/snjs';
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

type EditorOption = DropdownItem & {
  value: FeatureIdentifier | 'plain-editor';
};

const makeEditorDefault = (
  application: WebApplication,
  component: SNComponent,
  currentDefault: SNComponent
) => {
  if (currentDefault) {
    removeEditorDefault(application, currentDefault);
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
      .map((editor): EditorOption => {
        const identifier = editor.package_info.identifier;
        const [iconType, tint] = application.getIconAndTintForEditor(identifier);

        return {
          label: editor.name,
          value: identifier,
          ...(iconType ? { icon: iconType } : null),
          ...(tint ? { iconClassName: `color-accessory-tint-${tint}` } : null),
        };
      })
      .concat([
        {
          icon: 'plain-text',
          iconClassName: `color-accessory-tint-1`,
          label: 'Plain Editor',
          value: 'plain-editor',
        },
      ])
      .sort((a, b) => {
        return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1;
      });

    setEditorItems(editors);
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
              label="Select the default editor"
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
