import { isNullOrUndefined, SNLog } from '@standardnotes/snjs';
import { isDesktopApplication, isDev } from '@/utils';
import { storage, StorageKey } from './localStorage';
import Bugsnag from '@bugsnag/js';
import { WebCrypto } from '../crypto';
import { AppVersion } from '@/version';

function redactFilePath(line: string): string {
  const fileName = line.match(/\w+\.(html|js)/)?.[0];
  const redacted = '<redacted file path>';
  if (fileName) {
    return redacted + '/' + fileName;
  } else {
    return redacted;
  }
}

export function startErrorReporting(): void {
  const disableErrorReporting = storage.get(StorageKey.DisableErrorReporting);
  if (
    /**
     * Error reporting used to be opt-out, but is now opt-in, so
     * treat the absence of an error reporting preference as an indication
     * to disable error reporting.
     */
    isNullOrUndefined(disableErrorReporting) ||
    disableErrorReporting ||
    !window._bugsnag_api_key
  ) {
    SNLog.onError = console.error;
    return;
  }
  try {
    const storedUserId = storage.get(StorageKey.AnonymousUserId);
    let anonymousUserId: string;
    if (storedUserId === null) {
      anonymousUserId = WebCrypto.generateUUIDSync();
      storage.set(StorageKey.AnonymousUserId, anonymousUserId);
    } else {
      anonymousUserId = storedUserId;
    }

    Bugsnag.start({
      apiKey: window._bugsnag_api_key,
      appType: isDesktopApplication() ? 'desktop' : 'web',
      appVersion: AppVersion,
      collectUserIp: false,
      autoTrackSessions: false,
      releaseStage: isDev ? 'development' : undefined,
      enabledBreadcrumbTypes: ['error', 'log'],
      onError(event) {
        event.setUser(anonymousUserId);

        /**
         * Redact any data that could be used to identify user,
         * such as file paths.
         */
        if (isDesktopApplication()) {
          if (event.context) {
            event.context = `Desktop/${redactFilePath(event.context)}`;
          }
        }

        if (event.request.url?.includes('file:')) {
          event.request.url = redactFilePath(event.request.url);
        }

        const originalStack = event.originalError.stack;
        if (
          typeof originalStack === 'string' &&
          originalStack.includes('file:')
        ) {
          event.originalError.stack = originalStack
            .split('\n')
            .map((line) =>
              line.includes('file:') ? redactFilePath(line) : line
            )
            .join('\n');
        }

        for (const error of event.errors) {
          for (const stackFrame of error.stacktrace) {
            if (stackFrame.file.includes('file:')) {
              stackFrame.file = redactFilePath(stackFrame.file);
            }
          }
        }
      },
    });

    if (isDev) {
      SNLog.onError = console.error;
    } else {
      SNLog.onError = (error) => {
        Bugsnag.notify(error);
      };
    }
  } catch (error) {
    console.error('Failed to start Bugsnag.', error);
    SNLog.onError = console.error;
  }
}

export function disableErrorReporting() {
  storage.remove(StorageKey.AnonymousUserId);
  storage.set(StorageKey.DisableErrorReporting, true);
}

export function enableErrorReporting() {
  storage.set(StorageKey.DisableErrorReporting, false);
}

export function errorReportingId() {
  return storage.get(StorageKey.AnonymousUserId);
}
