import { displayStringForContentType, SNComponent } from '@standardnotes/snjs';
import { Button } from '@/components/Button';
import { FunctionComponent } from 'preact';
import {
  Title,
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
} from '../../components';

export const ConfirmCustomExtension: FunctionComponent<{
  component: SNComponent,
  callback: (confirmed: boolean) => void
}> = ({component, callback}) => {

  const fields = [
    {
      label: 'Name',
      value: component.package_info.name
    },
    {
      label: 'Description',
      value: component.package_info.description
    },
    {
      label: 'Version',
      value: component.package_info.version
    },
    {
      label: 'Hosted URL',
      value: component.package_info.url
    },
    {
      label: 'Download URL',
      value: component.package_info.download_url
    },
    {
      label: 'Extension Type',
      value: displayStringForContentType(component.content_type)
    },
  ];

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Confirm Extension</Title>

          {fields.map((field) => {
            if(!field.value) {return undefined;}
            return (
              <PreferencesSegment>
                <p><strong>{field.label}</strong></p>
                <p>{field.value}</p>
              </PreferencesSegment>
            );
          })}

          <Button
            className="min-w-20"
            type="primary"
            label="Install"
            onClick={() => callback(true)}
          />

          <Button
            className="min-w-20"
            type="primary"
            label="Cancel"
            onClick={() => callback(false)}
          />

        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  );
};
