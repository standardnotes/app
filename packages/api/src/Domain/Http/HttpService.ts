import { isString, joinPaths, sleep } from '@standardnotes/utils'
import { Environment } from '@standardnotes/models'
import { Session, SessionToken } from '@standardnotes/domain-core'

import { HttpRequestParams } from './HttpRequestParams'
import { HttpVerb } from './HttpVerb'
import { HttpRequest } from './HttpRequest'
import { HttpResponse } from './HttpResponse'
import { HttpServiceInterface } from './HttpServiceInterface'
import { HttpStatusCode } from './HttpStatusCode'
import { XMLHttpRequestState } from './XMLHttpRequestState'
import { ErrorMessage } from '../Error/ErrorMessage'
import { HttpResponseMeta } from './HttpResponseMeta'
import { HttpErrorResponseBody } from './HttpErrorResponseBody'
import { Paths } from '../Server/Auth/Paths'
import { SessionRefreshResponse } from '../Response/Auth/SessionRefreshResponse'

export class HttpService implements HttpServiceInterface {
  private session: Session | null
  private __latencySimulatorMs?: number
  private declare host: string

  constructor(
    private environment: Environment,
    private appVersion: string,
    private snjsVersion: string,
    private updateMetaCallback: (meta: HttpResponseMeta) => void,
    private refreshSessionCallback: (session: Session) => void,
  ) {
    this.session = null
  }

  setSession(session: Session): void {
    this.session = session
  }

  setHost(host: string): void {
    this.host = host
  }

  async get(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Get,
      authentication: authentication ?? this.session?.accessToken.value,
    })
  }

  async post(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Post,
      authentication: authentication ?? this.session?.accessToken.value,
    })
  }

  async put(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Put,
      authentication: authentication ?? this.session?.accessToken.value,
    })
  }

  async patch(path: string, params: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Patch,
      authentication: authentication ?? this.session?.accessToken.value,
    })
  }

  async delete(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({
      url: joinPaths(this.host, path),
      params,
      verb: HttpVerb.Delete,
      authentication: authentication ?? this.session?.accessToken.value,
    })
  }

  private async runHttp(httpRequest: HttpRequest): Promise<HttpResponse> {
    const request = this.createXmlRequest(httpRequest)

    if (this.__latencySimulatorMs) {
      await sleep(this.__latencySimulatorMs, true)
    }

    const response = await this.runRequest(request, this.createRequestBody(httpRequest))

    if (response.meta) {
      this.updateMetaCallback(response.meta)
    }

    if (response.status === HttpStatusCode.ExpiredAccessToken) {
      const isSessionRefreshed = await this.refreshSession()
      if (!isSessionRefreshed) {
        return response
      }

      httpRequest.authentication = this.session?.accessToken.value

      return this.runHttp(httpRequest)
    }

    return response
  }

  private async refreshSession(): Promise<boolean> {
    if (this.session === null) {
      return false
    }

    const response = (await this.post(Paths.v1.refreshSession, {
      access_token: this.session.accessToken.value,
      refresh_token: this.session.refreshToken.value,
    })) as SessionRefreshResponse

    if (response.data.error) {
      return false
    }

    if (response.meta) {
      this.updateMetaCallback(response.meta)
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

  private createRequestBody(httpRequest: HttpRequest): string | Uint8Array | undefined {
    if (
      httpRequest.params !== undefined &&
      [HttpVerb.Post, HttpVerb.Put, HttpVerb.Patch, HttpVerb.Delete].includes(httpRequest.verb)
    ) {
      return JSON.stringify(httpRequest.params)
    }

    return httpRequest.rawBytes
  }

  private createXmlRequest(httpRequest: HttpRequest) {
    const request = new XMLHttpRequest()
    if (httpRequest.params && httpRequest.verb === HttpVerb.Get && Object.keys(httpRequest.params).length > 0) {
      httpRequest.url = this.urlForUrlAndParams(httpRequest.url, httpRequest.params)
    }
    request.open(httpRequest.verb, httpRequest.url, true)
    request.responseType = httpRequest.responseType ?? ''

    if (!httpRequest.external) {
      request.setRequestHeader('X-SNJS-Version', this.snjsVersion)

      const appVersionHeaderValue = `${Environment[this.environment]}-${this.appVersion}`
      request.setRequestHeader('X-Application-Version', appVersionHeaderValue)

      if (httpRequest.authentication) {
        request.setRequestHeader('Authorization', 'Bearer ' + httpRequest.authentication)
      }
    }

    let contenTypeIsSet = false
    if (httpRequest.customHeaders && httpRequest.customHeaders.length > 0) {
      httpRequest.customHeaders.forEach(({ key, value }) => {
        request.setRequestHeader(key, value)
        if (key === 'Content-Type') {
          contenTypeIsSet = true
        }
      })
    }
    if (!contenTypeIsSet && !httpRequest.external) {
      request.setRequestHeader('Content-Type', 'application/json')
    }

    return request
  }

  private async runRequest(request: XMLHttpRequest, body?: string | Uint8Array): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      request.onreadystatechange = () => {
        this.stateChangeHandlerForRequest(request, resolve, reject)
      }
      request.send(body)
    })
  }

  private stateChangeHandlerForRequest(
    request: XMLHttpRequest,
    resolve: (response: HttpResponse) => void,
    reject: (response: HttpResponse) => void,
  ) {
    if (request.readyState !== XMLHttpRequestState.Completed) {
      return
    }
    const httpStatus = request.status
    const response: HttpResponse = {
      status: httpStatus,
      headers: new Map<string, string | null>(),
    }

    const responseHeaderLines = request
      .getAllResponseHeaders()
      ?.trim()
      .split(/[\r\n]+/)
    responseHeaderLines?.forEach((responseHeaderLine) => {
      const parts = responseHeaderLine.split(': ')
      const name = parts.shift() as string
      const value = parts.join(': ')

      ;(<Map<string, string | null>>response.headers).set(name, value)
    })

    try {
      if (httpStatus !== HttpStatusCode.NoContent) {
        let body

        const contentTypeHeader = response.headers?.get('content-type') || response.headers?.get('Content-Type')

        if (contentTypeHeader?.includes('application/json')) {
          body = JSON.parse(request.responseText)
        } else {
          body = request.response
        }
        /**
         * v0 APIs do not have a `data` top-level object. In such cases, mimic
         * the newer response body style by putting all the top-level
         * properties inside a `data` object.
         */
        if (!body.data) {
          response.data = body
        }
        if (!isString(body)) {
          Object.assign(response, body)
        }
      }
    } catch (error) {
      console.error(error)
    }
    if (httpStatus >= HttpStatusCode.Success && httpStatus < HttpStatusCode.InternalServerError) {
      if (httpStatus === HttpStatusCode.Forbidden && response.data && response.data.error !== undefined) {
        ;(response.data as HttpErrorResponseBody).error.message = ErrorMessage.RateLimited
      }
      resolve(response)
    } else {
      reject(response)
    }
  }

  private urlForUrlAndParams(url: string, params: HttpRequestParams) {
    const keyValueString = Object.keys(params)
      .map((key) => {
        return key + '=' + encodeURIComponent(params[key] as string)
      })
      .join('&')

    if (url.includes('?')) {
      return url + '&' + keyValueString
    } else {
      return url + '?' + keyValueString
    }
  }
}
