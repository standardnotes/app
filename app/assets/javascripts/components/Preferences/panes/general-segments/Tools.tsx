import { HorizontalSeparator } from '@/components/Shared/HorizontalSeparator';
import { Switch } from '@/components/Switch';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/components/Preferences/components';
import { WebApplication } from '@/ui_models/application';
import { PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

type Props = {
  application: WebApplication;
};

export const Tools: FunctionalComponent<Props> = observer(
  ({ application }: Props) => {
    const [monospaceFont, setMonospaceFont] = useState(() =>
      application.getPreference(PrefKey.EditorMonospaceEnabled, true)
    );
    const [marginResizers, setMarginResizers] = useState(() =>
      application.getPreference(PrefKey.EditorResizersEnabled, true)
    );

    const toggleMonospaceFont = () => {
      setMonospaceFont(!monospaceFont);
      application.setPreference(PrefKey.EditorMonospaceEnabled, !monospaceFont);
    };

    const toggleMarginResizers = () => {
      setMarginResizers(!marginResizers);
      application.setPreference(PrefKey.EditorResizersEnabled, !marginResizers);
    };

    return (
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Tools</Title>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Subtitle>Monospace Font</Subtitle>
                <Text>Toggles the font style in the Plain Text editor.</Text>
              </div>
              <Switch onChange={toggleMonospaceFont} checked={monospaceFont} />
            </div>
            <HorizontalSeparator classes="mt-5 mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Subtitle>Margin Resizers</Subtitle>
                <Text>Allows left and right editor margins to be resized.</Text>
              </div>
              <Switch
                onChange={toggleMarginResizers}
                checked={marginResizers}
              />
            </div>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    );
  }
);
