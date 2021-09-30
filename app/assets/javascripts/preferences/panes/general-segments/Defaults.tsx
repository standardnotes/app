import { Dropdown, DropdownItem } from '@/components/Dropdown';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { ComponentArea } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

type Props = {
  application: WebApplication;
};

export const Defaults: FunctionComponent<Props> = ({ application }) => {
  const [editorItems, setEditorItems] = useState<DropdownItem[]>([]);

  useEffect(() => {
    const editors = application.componentManager
      .componentsForArea(ComponentArea.Editor)
      .map((editor) => {
        return {
          label: editor.name,
          value: editor.package_info.identifier,
        };
      });

    setEditorItems([
      {
        label: 'Plain Editor',
        value: 'plain-editor',
      },
      ...editors,
    ]);
  }, [application]);

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
              defaultValue="plain-editor"
            />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
