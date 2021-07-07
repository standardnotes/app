import { IconButton } from '@/components/IconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { Preferences } from './preferences';
import { PreferencesMenu } from './menu';
import { HelpAndFeedback } from './help-feedback';
import { observer } from 'mobx-react-lite';

interface PreferencesViewProps {
  close: () => void;
}

export const PreferencesCanvas: FunctionComponent<{
  preferences: Preferences;
}> = observer(({ preferences: prefs }) => (
  <div className="flex flex-row flex-grow min-h-0 justify-between">
    <PreferencesMenu preferences={prefs}></PreferencesMenu>
    {/* Temporary selector until a full solution is implemented */}
    {prefs.selectedItem.label === 'Help & feedback' ? (
      <HelpAndFeedback />
    ) : null}
  </div>
));

export const PreferencesView: FunctionComponent<PreferencesViewProps> =
  observer(({ close }) => {
    const prefs = new Preferences();
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
        <PreferencesCanvas preferences={prefs} />
      </div>
    );
  });
