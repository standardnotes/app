export interface HomeServerEnvironmentConfiguration {
  jwtSecret: string
  authJwtSecret: string
  encryptionServerKey: string
  pseudoKeyParamsKey: string
  valetTokenSecret: string
  port: number
  logLevel?: string
  databaseEngine: 'sqlite' | 'mysql'
  mysqlConfiguration?: {
    host: string
    port: number
    username: string
    password: string
    database: string
  }
}
