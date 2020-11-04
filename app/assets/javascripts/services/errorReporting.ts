import { SNLog } from 'snjs';
import { isDesktopApplication, isDev } from '@/utils';
import { storage, StorageKey } from './localStorage';
import Bugsnag from '@bugsnag/js';

declare const __VERSION__: string;

function redactFilePath(line: string): string {
  const fileName = line.match(/\w+\.(html|js)?.*/)?.[0];
  const redacted = '<redacted file path>';
  if (fileName) {
    return redacted + '/' + fileName;
  } else {
    return redacted;
  }
}

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
      releaseStage: isDev ? 'development' : undefined,
      onError(event) {
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
