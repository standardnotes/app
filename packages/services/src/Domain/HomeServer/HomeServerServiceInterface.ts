export interface HomeServerServiceInterface {
  isHomeServerEnabled(): boolean
  getHomeServerDataLocation(): string | undefined
  enableHomeServer(): Promise<void>
  disableHomeServer(): Promise<void>
  changeHomeServerDataLocation(): Promise<string | undefined>
  openHomeServerDataLocation(): Promise<void>
}
