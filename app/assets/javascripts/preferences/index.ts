import { toDirective } from '../components/utils';
import {
  PreferencesViewWrapper,
  PreferencesViewWrapperProps,
} from './PreferencesViewWrapper';

export const PreferencesDirective = toDirective<PreferencesViewWrapperProps>(
  PreferencesViewWrapper
);
