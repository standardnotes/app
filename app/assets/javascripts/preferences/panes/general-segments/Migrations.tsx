import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import {
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '../../components';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const CheckIcon: React.FC = () => {
  return <Icon className="success min-w-4 min-h-4" type="check-bold" />;
};

const Migration3dot0dot0: FunctionComponent<Props> = ({ application }) => {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const trigger = useCallback(() => {
    setLoading(true);
    setError(null);
    setComplete(false);
    application
      .migrateTagDotsToHierarchy()
      .then(() => {
        setLoading(false);
        setError(null);
        setComplete(true);
      })
      .catch((error: unknown) => {
        setLoading(false);
        setError(error);
        setComplete(false);
      });
  }, [application, setLoading, setError]);

  return (
    <>
      <Subtitle>(3.0.0) Folders Component to Native Folders</Subtitle>
      <Text>
        This migration transform tags with "." in their title into a hierarchy
        of parents. This lets your transform tag hierarchies created with the
        folder component into native tag folders.
      </Text>
      <div className="flex flex-row items-center mt-3">
        <Button
          type="normal"
          onClick={trigger}
          className="m-2"
          disabled={loading}
          label="Run Now"
        />
        {complete && (
          <div className="ml-3">
            <Text>Migration successful.</Text>
          </div>
        )}
        {error && (
          <div className="ml-3">
            <Text>Something wrong happened. Please contact support.</Text>
          </div>
        )}
      </div>
    </>
  );
};

export const Migrations: FunctionComponent<Props> = ({
  application,
  appState,
}) => {
  if (!appState.features.enableNativeFoldersFeature) {
    return null;
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Migrations</Title>
        <div className="h-2 w-full" />
        <Migration3dot0dot0 application={application} appState={appState} />
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
