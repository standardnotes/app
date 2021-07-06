import { IconButton } from '@/components/IconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { MockState } from './mock-state';
import { PreferencesMenu } from './menu';

interface PreferencesViewProps {
  close: () => void;
}

export const PreferencesView: FunctionComponent<PreferencesViewProps> = ({
  close,
}) => {
  const store = new MockState();
  return (
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
      <div className="flex flex-row flex-grow min-h-0">
        <PreferencesMenu store={store}></PreferencesMenu>
      </div>
    </div>
  );
};
