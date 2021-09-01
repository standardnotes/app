import { toDirective } from '../components/utils';
import {
  PreferencesViewWrapper,
  PreferencesWrapperProps,
} from './PreferencesView';

export const PreferencesDirective = toDirective<PreferencesWrapperProps>(
  PreferencesViewWrapper
);
