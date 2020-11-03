import { isDesktopApplication, isDev } from '@/utils';
import { storage, StorageKey } from './localStorage';
import Bugsnag from '@bugsnag/js';

declare const __VERSION__: string;

export async function startErrorReporting() {
  if (storage.get(StorageKey.DisableErrorReporting)) {
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
  } catch (error) {
    console.error('Failed to start Bugsnag.', error);
  }
}
