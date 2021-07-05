import { IconButton } from '@/components/IconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from './pane';

interface PreferencesViewProps {
  close: () => void;
}

export const PreferencesView: FunctionComponent<PreferencesViewProps> = ({
  close,
}) => (
  <div className="sn-full-screen flex flex-col bg-contrast z-index-preferences">
    <TitleBar className="items-center justify-between">
      {/* div is added so flex justify-between can center the title */}
      <div className="h-8 w-8" />
      <Title className="text-lg">Your preferences for Standard Notes</Title>
      <IconButton
        onClick={() => {
          close();
        }}
        type="normal"
        iconType="close"
      />
    </TitleBar>
    <PreferencesPane />
  </div>
);
