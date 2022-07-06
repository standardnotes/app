import { Uuid } from '@standardnotes/common'
import { SettingName, SubscriptionSettingName } from '@standardnotes/settings'

const FilesPaths = {
  closeUploadSession: '/v1/files/upload/close-session',
  createFileValetToken: '/v1/files/valet-tokens',
  deleteFile: '/v1/files',
  downloadFileChunk: '/v1/files',
  startUploadSession: '/v1/files/upload/create-session',
  uploadFileChunk: '/v1/files/upload/chunk',
}

const UserPaths = {
  changeCredentials: (userUuid: string) => `/v1/users/${userUuid}/attributes/credentials`,
  deleteAccount: (userUuid: Uuid) => `/v1/users/${userUuid}`,
  keyParams: '/v1/login-params',
  refreshSession: '/v1/sessions/refresh',
  register: '/v1/users',
  session: (sessionUuid: string) => `/v1/sessions/${sessionUuid}`,
  sessions: '/v1/sessions',
  signIn: '/v1/login',
  signOut: '/v1/logout',
}

const ItemsPaths = {
  checkIntegrity: '/v1/items/check-integrity',
  getSingleItem: (uuid: Uuid) => `/v1/items/${uuid}`,
  itemRevisions: (itemUuid: string) => `/v1/items/${itemUuid}/revisions`,
  itemRevision: (itemUuid: string, revisionUuid: string) => `/v1/items/${itemUuid}/revisions/${revisionUuid}`,
  sync: '/v1/items',
}

const SettingsPaths = {
  settings: (userUuid: Uuid) => `/v1/users/${userUuid}/settings`,
  setting: (userUuid: Uuid, settingName: SettingName) => `/v1/users/${userUuid}/settings/${settingName}`,
  subscriptionSetting: (userUuid: Uuid, settingName: SubscriptionSettingName) =>
    `/v1/users/${userUuid}/subscription-settings/${settingName}`,
}

const SubscriptionPaths = {
  offlineFeatures: '/v1/offline/features',
  purchase: '/v1/purchase',
  subscription: (userUuid: Uuid) => `/v1/users/${userUuid}/subscription`,
  subscriptionTokens: '/v1/subscription-tokens',
  userFeatures: (userUuid: string) => `/v1/users/${userUuid}/features`,
}

const SubscriptionPathsV2 = {
  subscriptions: '/v2/subscriptions',
}

const UserPathsV2 = {
  keyParams: '/v2/login-params',
  signIn: '/v2/login',
}

const ListedPaths = {
  listedRegistration: (userUuid: Uuid) => `/v1/users/${userUuid}/integrations/listed`,
}

export const Paths = {
  v1: {
    ...FilesPaths,
    ...ItemsPaths,
    ...ListedPaths,
    ...SettingsPaths,
    ...SubscriptionPaths,
    ...UserPaths,
  },
  v2: {
    ...SubscriptionPathsV2,
    ...UserPathsV2,
  },
}
