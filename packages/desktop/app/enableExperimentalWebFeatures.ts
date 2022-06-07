import { app } from 'electron'

/**
 * @FIXME
 * Due to a bug in Electron (https://github.com/electron/electron/issues/28422),
 * downloading a file using the File System Access API does not work, causing an exception:
 * "Uncaught DOMException: The request is not allowed by the user agent or the platform in the current context."
 *
 * The following workaround fixes the issue by enabling experimental web platform features
 * which makes the file system access permission always be true.
 *
 * Since this workaround involves enabling experimental features, it could lead
 * to other issues. This should be removed as soon as the upstream bug is fixed.
 */
export const enableExperimentalFeaturesForFileAccessFix = () =>
  app.commandLine.appendSwitch('enable-experimental-web-platform-features')
