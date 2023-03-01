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
