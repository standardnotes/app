import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { ErrorReporting } from './general-segments';

interface GeneralProps {
  appState: AppState;
  application: WebApplication;
}

export const General: FunctionComponent<GeneralProps> = (props) => (
  <PreferencesPane>
    <ErrorReporting appState={props.appState} />
  </PreferencesPane>
);
