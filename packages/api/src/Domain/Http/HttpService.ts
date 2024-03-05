import { LoggerInterface, joinPaths, sleep } from '@standardnotes/utils'
import { Environment } from '@standardnotes/models'
import { LegacySession, Session, SessionToken } from '@standardnotes/domain-core'
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
  private declare host: string
  loggingEnabled = false

  private inProgressRefreshSessionPromise?: Promise<boolean>
  private updateMetaCallback!: (meta: HttpResponseMeta) => void
  private refreshSessionCallback!: (session: Session) => void

  private requestHandler: RequestHandlerInterface

  constructor(
    private environment: Environment,
    private appVersion: string,
    private snjsVersion: string,
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
        this.inProgressRefreshSessionPromise = this.refreshSession()
        const isSessionRefreshed = await this.inProgressRefreshSessionPromise
        this.inProgressRefreshSessionPromise = undefined

        if (!isSessionRefreshed) {
          return response
        }
      }

      httpRequest.authentication = this.getSessionAccessToken()

      return this.runHttp(httpRequest)
    }

    return response
  }

  async refreshSession(): Promise<boolean> {
    if (!this.session) {
      return false
    }

    if (this.session instanceof LegacySession) {
      return false
    }

    const response = await this.post<SessionRefreshResponseBody>(Paths.v1.refreshSession, {
      access_token: this.session.accessToken.value,
      refresh_token: this.session.refreshToken.value,
    })

    if (isErrorResponse(response)) {
      return false
    }

    if (response.meta) {
      this.updateMetaCallback?.(response.meta)
    }

    const accessTokenOrError = SessionToken.create(
      response.data.session.access_token,
      response.data.session.access_expiration,
    )
    if (accessTokenOrError.isFailed()) {
      return false
    }

    const accessToken = accessTokenOrError.getValue()

    const refreshTokenOrError = SessionToken.create(
      response.data.session.refresh_token,
      response.data.session.refresh_expiration,
    )
    if (refreshTokenOrError.isFailed()) {
      return false
    }

    const refreshToken = refreshTokenOrError.getValue()

    const sessionOrError = Session.create(accessToken, refreshToken, response.data.session.readonly_access)
    if (sessionOrError.isFailed()) {
      return false
    }

    this.setSession(sessionOrError.getValue())

    this.refreshSessionCallback(this.session)

    return true
  }

  private params(inParams: Record<string | number | symbol, unknown>): HttpRequestParams {
    const params = {
      ...inParams,
      ...{
        [ApiEndpointParam.ApiVersion]: ApiVersion.v1,
      },
    }

    return params
  }
}
