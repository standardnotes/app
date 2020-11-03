import { SNLog } from 'snjs';
import { isDesktopApplication, isDev } from '@/utils';
import { storage, StorageKey } from './localStorage';
import Bugsnag from '@bugsnag/js';

declare const __VERSION__: string;

export function startErrorReporting() {
  if (storage.get(StorageKey.DisableErrorReporting)) {
    SNLog.onError = console.error;
    return;
  }
  try {
    Bugsnag.start({
      apiKey: (window as any)._bugsnag_api_key,
      appType: isDesktopApplication() ? 'desktop' : 'web',
      appVersion: __VERSION__,
      collectUserIp: false,
      autoTrackSessions: false,
      releaseStage: isDev ? 'development' : undefined
    });
    if (isDev) {
      SNLog.onError = console.error;
    } else {
      SNLog.onError = (error) => {
        Bugsnag.notify(error);
      }
    }
  } catch (error) {
    console.error('Failed to start Bugsnag.', error);
    SNLog.onError = console.error;
  }
}
