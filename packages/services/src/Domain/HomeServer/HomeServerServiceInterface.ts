export interface HomeServerServiceInterface {
  isHomeServerEnabled(): boolean
  getHomeServerDataLocation(): string | undefined
  enableHomeServer(): Promise<void>
  disableHomeServer(): void
  changeHomeServerDataLocation(): Promise<string | undefined>
  openHomeServerDataLocation(): Promise<void>
}
