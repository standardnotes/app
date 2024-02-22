import {
  HttpErrorResponse,
  HttpRequest,
  HttpRequestParams,
  HttpResponse,
  HttpStatusCode,
  HttpVerb,
  isErrorResponse,
} from '@standardnotes/responses'
import { RequestHandlerInterface } from './RequestHandlerInterface'
import { Environment } from '@standardnotes/models'
import { isString } from 'lodash'
import { ErrorMessage } from '../Error'
import { LoggerInterface } from '@standardnotes/utils'

export class FetchRequestHandler implements RequestHandlerInterface {
  constructor(
    protected readonly snjsVersion: string,
    protected readonly appVersion: string,
    protected readonly environment: Environment,
    private logger: LoggerInterface,
  ) {}

  async handleRequest<T>(httpRequest: HttpRequest): Promise<HttpResponse<T>> {
    const request = this.createRequest(httpRequest)

    const response = await this.runRequest<T>(request, this.createRequestBody(httpRequest))

    return response
  }

  private createRequest(httpRequest: HttpRequest): Request {
    if (httpRequest.params && httpRequest.verb === HttpVerb.Get && Object.keys(httpRequest.params).length > 0) {
      httpRequest.url = this.urlForUrlAndParams(httpRequest.url, httpRequest.params)
    }

    const headers: Record<string, string> = {}

    if (!httpRequest.external) {
      headers['X-SNJS-Version'] = this.snjsVersion

      const appVersionHeaderValue = `${Environment[this.environment]}-${this.appVersion}`
      headers['X-Application-Version'] = appVersionHeaderValue

      if (httpRequest.authentication) {
        headers['Authorization'] = 'Bearer ' + httpRequest.authentication
      }
    }

    let contentTypeIsSet = false
    if (httpRequest.customHeaders && httpRequest.customHeaders.length > 0) {
      httpRequest.customHeaders.forEach(({ key, value }) => {
        headers[key] = value
        if (key === 'Content-Type') {
          contentTypeIsSet = true
        }
      })
    }
    if (!contentTypeIsSet && !httpRequest.external) {
      headers['Content-Type'] = 'application/json'
    }

    return new Request(httpRequest.url, {
      method: httpRequest.verb,
      headers,
      credentials: 'include',
    })
  }

  private async runRequest<T>(request: Request, body?: string | Uint8Array | undefined): Promise<HttpResponse<T>> {
    try {
      const fetchResponse = await fetch(request, {
        body,
      })

      const response = await this.handleFetchResponse<T>(fetchResponse)

      return response
    } catch (error) {
      return {
        status: HttpStatusCode.InternalServerError,
        headers: new Map<string, string | null>(),
        data: {
          error: {
            message:
              'message' in (error as { message: string }) ? (error as { message: string }).message : 'Unknown error',
          },
        },
      }
    }
  }

  private async handleFetchResponse<T>(fetchResponse: Response): Promise<HttpResponse<T>> {
    const httpStatus = fetchResponse.status
    const response: HttpResponse<T> = {
      status: httpStatus,
      headers: new Map<string, string | null>(),
      data: {} as T,
    }
    fetchResponse.headers.forEach((value, key) => {
      ;(<Map<string, string | null>>response.headers).set(key, value)
    })

    try {
      if (httpStatus !== HttpStatusCode.NoContent) {
        let body

        const contentTypeHeader = response.headers?.get('content-type') || response.headers?.get('Content-Type')

        if (contentTypeHeader?.includes('application/json')) {
          body = JSON.parse(await fetchResponse.text())
        } else {
          body = await fetchResponse.arrayBuffer()
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
      this.logger.error(JSON.stringify(error))
    }

    if (httpStatus >= HttpStatusCode.Success && httpStatus < HttpStatusCode.InternalServerError) {
      if (httpStatus === HttpStatusCode.Forbidden && isErrorResponse(response)) {
        if (!response.data.error) {
          response.data.error = {
            message: ErrorMessage.RateLimited,
          }
        } else {
          response.data.error.message = ErrorMessage.RateLimited
        }
      }
      return response
    } else {
      const errorResponse = response as HttpErrorResponse
      if (!errorResponse.data) {
        errorResponse.data = {
          error: {
            message: 'Unknown error',
          },
        }
      }

      if (isString(errorResponse.data)) {
        errorResponse.data = {
          error: {
            message: errorResponse.data,
          },
        }
      }

      if (!errorResponse.data.error) {
        errorResponse.data.error = {
          message: 'Unknown error',
        }
      }

      return errorResponse
    }
  }

  private urlForUrlAndParams(url: string, params: HttpRequestParams) {
    const keyValueString = Object.keys(params as Record<string, unknown>)
      .map((key) => {
        return key + '=' + encodeURIComponent((params as Record<string, unknown>)[key] as string)
      })
      .join('&')

    if (url.includes('?')) {
      return url + '&' + keyValueString
    } else {
      return url + '?' + keyValueString
    }
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
}
