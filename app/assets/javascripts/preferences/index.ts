import { toDirective } from '../components/utils';
import {
  PreferencesViewWrapper,
  PreferencesWrapperProps,
} from './PreferencesWrapper';

export const PreferencesDirective = toDirective<PreferencesWrapperProps>(
  PreferencesViewWrapper
);
