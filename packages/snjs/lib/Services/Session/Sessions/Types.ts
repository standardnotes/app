import { Uuid } from '@standardnotes/common'

export type RawJwtPayload = {
  jwt?: string
}

export type RawSessionPayload = {
  accessToken: string
  refreshToken: string
  accessExpiration: number
  refreshExpiration: number
  readonlyAccess: boolean
}

export type RawStorageValue = RawJwtPayload | RawSessionPayload

export type RemoteSession = {
  uuid: Uuid
  updated_at: Date
  device_info: string
  current: boolean
}
