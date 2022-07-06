export const APPLICATION_DEFAULT_HOSTS = [
  'api.standardnotes.com',
  'api-dev.standardnotes.com',
  'sync.standardnotes.org',
  'syncing-server-demo.standardnotes.com',
]

export const FILES_DEFAULT_HOSTS = ['files.standardnotes.com', 'files-dev.standardnotes.com']

export const TRUSTED_FEATURE_HOSTS = [
  'api-dev.standardnotes.com',
  'api.standardnotes.com',
  'extensions.standardnotes.com',
  'extensions.standardnotes.org',
  'extensions-server-dev.standardnotes.org',
  'extensions-server-dev.standardnotes.com',
  'features.standardnotes.com',
]

export enum ExtensionsServerURL {
  Dev = 'https://extensions-server-dev.standardnotes.org',
  Prod = 'https://extensions.standardnotes.org',
}

const LocalHost = 'localhost'

export function isUrlFirstParty(url: string): boolean {
  try {
    const { host } = new URL(url)
    return host.startsWith(LocalHost) || APPLICATION_DEFAULT_HOSTS.includes(host) || FILES_DEFAULT_HOSTS.includes(host)
  } catch (_err) {
    return false
  }
}

export const PROD_OFFLINE_FEATURES_URL = 'https://api.standardnotes.com/v1/offline/features'

export const LEGACY_PROD_EXT_ORIGIN = 'https://extensions.standardnotes.org'

export const TRUSTED_CUSTOM_EXTENSIONS_HOSTS = ['listed.to']
