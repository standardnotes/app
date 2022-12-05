import { RootQueryParam } from './RootQueryParam'
import { RouteParserInterface } from './RouteParserInterface'

export interface RouteServiceInterface {
  deinit(): void
  getRoute(): RouteParserInterface
  removeQueryParameterFromURL(param: RootQueryParam): void
  get isDotOrg(): boolean
}
