import { RouteParserInterface } from './RouteParserInterface'

export interface RouteServiceInterface {
  deinit(): void
  getRoute(): RouteParserInterface
  removeSettingsFromURLQueryParameters(): void
}
