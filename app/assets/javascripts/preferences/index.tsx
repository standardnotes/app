import { toDirective } from '../components/utils';
import { PreferencesViewWrapper, PreferencesWrapperProps } from './view';

export const PreferencesDirective = toDirective<PreferencesWrapperProps>(
  PreferencesViewWrapper
);
