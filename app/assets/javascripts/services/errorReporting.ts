import { SNLog } from 'snjs';
import { isDesktopApplication, isDev } from '@/utils';
import { storage, StorageKey } from './localStorage';

declare const __VERSION__: string;

export async function startErrorReporting() {
  if (storage.get(StorageKey.DisableErrorReporting)) {
    SNLog.onError = console.error;
    return;
  }
  try {
    const { default: Bugsnag } = await import('@bugsnag/js');
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
  }
}
