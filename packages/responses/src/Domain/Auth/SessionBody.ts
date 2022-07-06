export type SessionBody = {
  access_token: string
  refresh_token: string
  access_expiration: number
  refresh_expiration: number
  readonly_access: boolean
}
