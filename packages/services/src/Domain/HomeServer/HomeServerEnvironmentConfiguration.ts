export interface HomeServerEnvironmentConfiguration {
  jwtSecret: string
  authJwtSecret: string
  encryptionServerKey: string
  pseudoKeyParamsKey: string
  valetTokenSecret: string
  port: number
}
