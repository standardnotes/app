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
  <div className="preferences-view">
    <TitleBar className="title-bar">
      {/* div is added so flex justify-between can center the title */}
      <div className="h-8 w-8" />
      <Title className="title">Your preferences for Standard Notes</Title>
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
