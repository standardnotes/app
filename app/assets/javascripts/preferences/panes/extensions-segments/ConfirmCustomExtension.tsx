import { displayStringForContentType, SNComponent } from '@standardnotes/snjs';
import { Button } from '@/components/Button';
import { FunctionComponent } from 'preact';
import {
  Title,
  Text,
  Subtitle,
  PreferencesSegment,
} from '../../components';

export const ConfirmCustomExtension: FunctionComponent<{
  component: SNComponent,
  callback: (confirmed: boolean) => void
}> = ({ component, callback }) => {

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
    <PreferencesSegment>
      <Title>Confirm Extension</Title>

      {fields.map((field) => {
        if (!field.value) { return undefined; }
        return (
          <>
            <Subtitle>{field.label}</Subtitle>
            <Text>{field.value}</Text>
            <div className="min-h-2" />
          </>
        );
      })}

      <div className="min-h-3" />

      <div className="flex flex-row">
        <Button
          className="min-w-20"
          type="primary"
          label="Install"
          onClick={() => callback(true)}
        />

        <div className="min-w-3" />

        <Button
          className="min-w-20"
          type="primary"
          label="Cancel"
          onClick={() => callback(false)}
        />
      </div>

    </PreferencesSegment>
  );
};
