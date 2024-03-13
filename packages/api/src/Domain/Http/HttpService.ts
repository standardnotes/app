import { LoggerInterface, joinPaths, sleep } from '@standardnotes/utils'
import { Environment } from '@standardnotes/models'
import { LegacySession, Result, Session, SessionToken } from '@standardnotes/domain-core'
import {
  HttpStatusCode,
  HttpRequestParams,
  HttpVerb,
  HttpRequest,
  HttpResponse,
  HttpResponseMeta,
  isErrorResponse,
  ApiEndpointParam,
} from '@standardnotes/responses'
import { HttpServiceInterface } from './HttpServiceInterface'

import { ApiVersion } from '../Api'
import { Paths } from '../Server/Auth/Paths'
import { SessionRefreshResponseBody } from '../Response/Auth/SessionRefreshResponseBody'
import { FetchRequestHandler } from './FetchRequestHandler'
import { RequestHandlerInterface } from './RequestHandlerInterface'
import { HttpRequestOptions } from './HttpRequestOptions'

export class HttpService implements HttpServiceInterface {
  private session?: Session | LegacySession
  private __latencySimulatorMs?: number
  private __simulateNextSessionRefreshResponseDrop = false
  private declare host: string
  loggingEnabled = false

  private inProgressRefreshSessionPromise?: Promise<Result<HttpResponse<SessionRefreshResponseBody>>>
  private updateMetaCallback!: (meta: HttpResponseMeta) => void
  private refreshSessionCallback!: (session: Session) => void

  private requestHandler: RequestHandlerInterface

  constructor(
    private environment: Environment,
    private appVersion: string,
    private snjsVersion: string,
    private apiVersion: ApiVersion,
    private logger: LoggerInterface,
  ) {
    this.requestHandler = new FetchRequestHandler(this.snjsVersion, this.appVersion, this.environment, this.logger)
  }

  setCallbacks(
    updateMetaCallback: (meta: HttpResponseMeta) => void,
    refreshSessionCallback: (session: Session) => void,
  ): void {
    this.updateMetaCallback = updateMetaCallback
    this.refreshSessionCallback = refreshSessionCallback
  }

  public deinit(): void {
    ;(this.session as unknown) = undefined
    ;(this.updateMetaCallback as unknown) = undefined
    ;(this.refreshSessionCallback as unknown) = undefined
  }

  setSession(session: Session | LegacySession): void {
    this.session = session
  }

  setHost(host: string): void {
    this.host = host
  }

  getHost(): string {
    return this.host
  }

  private getSessionAccessToken(): string | undefined {
    if (!this.session) {
      return undefined
    }

    if (this.session instanceof Session) {
      return this.session.accessToken.value
    } else {
      return this.session.accessToken
    }
  }

  async get<T>(path: string, params?: HttpRequestParams, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    if (!this.host) {
      throw new Error('Attempting to make network request before host is set')
    }

    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Get,
      authentication: options?.authentication ?? this.getSessionAccessToken(),
    })
  }

  async getExternal<T>(url: string, params?: HttpRequestParams): Promise<HttpResponse<T>> {
    return this.runHttp({
      url,
      params,
      verb: HttpVerb.Get,
      external: true,
    })
  }

  async post<T>(path: string, params?: HttpRequestParams, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    if (!this.host) {
      throw new Error('Attempting to make network request before host is set')
    }

    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Post,
      authentication: options?.authentication ?? this.getSessionAccessToken(),
      customHeaders: options?.headers,
    })
  }

  async put<T>(path: string, params?: HttpRequestParams, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Put,
      authentication: options?.authentication ?? this.getSessionAccessToken(),
    })
  }

  async patch<T>(path: string, params: HttpRequestParams, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Patch,
      authentication: options?.authentication ?? this.getSessionAccessToken(),
    })
  }

  async delete<T>(path: string, params?: HttpRequestParams, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Delete,
      authentication: options?.authentication ?? this.getSessionAccessToken(),
    })
  }

  async runHttp<T>(httpRequest: HttpRequest): Promise<HttpResponse<T>> {
    if (this.__latencySimulatorMs) {
      await sleep(this.__latencySimulatorMs, true)
    }

    httpRequest.params = httpRequest.params
      ? this.params(httpRequest.params as Record<string | number | symbol, unknown>)
      : undefined

    const isRefreshRequest = httpRequest.url === joinPaths(this.host, Paths.v1.refreshSession)
    if (this.inProgressRefreshSessionPromise && !isRefreshRequest) {
      await this.inProgressRefreshSessionPromise

      httpRequest.authentication = this.getSessionAccessToken()
    }

    const response = await this.requestHandler.handleRequest<T>(httpRequest)

    if (this.loggingEnabled && isErrorResponse(response)) {
      this.logger.error('Request failed', httpRequest, response)
    }

    if (response.meta && !httpRequest.external) {
      this.updateMetaCallback?.(response.meta)
    }

    if (response.status === HttpStatusCode.ExpiredAccessToken && !isRefreshRequest && !httpRequest.external) {
      if (this.inProgressRefreshSessionPromise) {
        await this.inProgressRefreshSessionPromise
      } else {
        const hasSessionTokenRenewedInBetweenOurRequest = httpRequest.authentication !== this.getSessionAccessToken()
        if (!hasSessionTokenRenewedInBetweenOurRequest) {
          this.inProgressRefreshSessionPromise = this.refreshSession()
          const isSessionRefreshedResultOrError = await this.inProgressRefreshSessionPromise
          let isSessionRefreshed = false
          if (!isSessionRefreshedResultOrError.isFailed()) {
            isSessionRefreshed = !isErrorResponse(isSessionRefreshedResultOrError.getValue())
          }
          this.inProgressRefreshSessionPromise = undefined

          if (!isSessionRefreshed) {
            return response
          }
        }
      }

      httpRequest.authentication = this.getSessionAccessToken()

      return this.runHttp(httpRequest)
    }

    return response
  }

  async refreshSession(): Promise<Result<HttpResponse<SessionRefreshResponseBody>>> {
    if (!this.session) {
      return Result.fail('No session to refresh')
    }

    if (this.session instanceof LegacySession) {
      return Result.fail('Cannot refresh legacy session')
    }

    const response = await this.post<SessionRefreshResponseBody>(Paths.v1.refreshSession, {
      access_token: this.session.accessToken.value,
      refresh_token: this.session.refreshToken.value,
    })

    if (this.__simulateNextSessionRefreshResponseDrop) {
      this.__simulateNextSessionRefreshResponseDrop = false
      return Result.fail('Simulating a dropped response')
    }

    if (isErrorResponse(response)) {
      return Result.ok(response)
    }

    if (response.meta) {
      this.updateMetaCallback?.(response.meta)
    }

    const accessTokenOrError = SessionToken.create(
      response.data.session.access_token,
      response.data.session.access_expiration,
    )
    if (accessTokenOrError.isFailed()) {
      return Result.fail(accessTokenOrError.getError())
    }

    const accessToken = accessTokenOrError.getValue()

    const refreshTokenOrError = SessionToken.create(
      response.data.session.refresh_token,
      response.data.session.refresh_expiration,
    )
    if (refreshTokenOrError.isFailed()) {
      return Result.fail(refreshTokenOrError.getError())
    }

    const refreshToken = refreshTokenOrError.getValue()

    const sessionOrError = Session.create(accessToken, refreshToken, response.data.session.readonly_access)
    if (sessionOrError.isFailed()) {
      return Result.fail(sessionOrError.getError())
    }

    this.setSession(sessionOrError.getValue())

    this.refreshSessionCallback(this.session)

    return Result.ok(response)
  }

  private params(inParams: Record<string | number | symbol, unknown>): HttpRequestParams {
    const params = {
      ...inParams,
      ...{
        [ApiEndpointParam.ApiVersion]: this.apiVersion,
      },
    }

    return params
  }
}
