import { isString, joinPaths } from '@standardnotes/utils'
import { Environment } from '@standardnotes/models'
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

export class HttpService implements HttpServiceInterface {
  constructor(
    private environment: Environment,
    private appVersion: string,
    private snjsVersion: string,
    private host: string,
    private updateMetaCallback: (meta: HttpResponseMeta) => void,
  ) {}

  setHost(host: string): void {
    this.host = host
  }

  async get(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({ url: joinPaths(this.host, path), params, verb: HttpVerb.Get, authentication })
  }

  async post(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({ url: joinPaths(this.host, path), params, verb: HttpVerb.Post, authentication })
  }

  async put(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({ url: joinPaths(this.host, path), params, verb: HttpVerb.Put, authentication })
  }

  async patch(path: string, params: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({ url: joinPaths(this.host, path), params, verb: HttpVerb.Patch, authentication })
  }

  async delete(path: string, params?: HttpRequestParams, authentication?: string): Promise<HttpResponse> {
    return this.runHttp({ url: joinPaths(this.host, path), params, verb: HttpVerb.Delete, authentication })
  }

  private async runHttp(httpRequest: HttpRequest): Promise<HttpResponse> {
    const request = this.createXmlRequest(httpRequest)

    const response = await this.runRequest(request, this.createRequestBody(httpRequest))

    if (response.meta) {
      this.updateMetaCallback(response.meta)
    }

    return response
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
    if (httpStatus >= HttpStatusCode.Success && httpStatus < HttpStatusCode.MultipleChoices) {
      resolve(response)
    } else {
      if (httpStatus === HttpStatusCode.Forbidden && response.data && response.data.error !== undefined) {
        ;(response.data as HttpErrorResponseBody).error.message = ErrorMessage.RateLimited
      }

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
