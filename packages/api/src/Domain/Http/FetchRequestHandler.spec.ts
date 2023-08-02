import { Environment } from '@standardnotes/models'
import { HttpVerb } from '@standardnotes/responses'
import { FetchRequestHandler } from './FetchRequestHandler'
import { HttpErrorResponseBody, HttpRequest } from '@standardnotes/responses'

import { ErrorMessage } from '../Error'
import { LoggerInterface } from '@standardnotes/utils'

describe('FetchRequestHandler', () => {
  const snjsVersion = 'snjsVersion'
  const appVersion = 'appVersion'
  const environment = Environment.Web
  const logger: LoggerInterface = {} as jest.Mocked<LoggerInterface>
  const requestHandler = new FetchRequestHandler(snjsVersion, appVersion, environment, logger)

  it('should create a request', () => {
    const httpRequest: HttpRequest = {
      url: 'http://localhost:3000/test',
      verb: HttpVerb.Get,
      external: false,
      authentication: 'authentication',
      customHeaders: [],
      params: {
        key: 'value',
      },
    }

    const request = requestHandler['createRequest'](httpRequest)

    expect(request).toBeInstanceOf(Request)
    expect(request.url).toBe(httpRequest.url)
    expect(request.method).toBe(httpRequest.verb)
    expect(request.headers.get('X-SNJS-Version')).toBe(snjsVersion)
    expect(request.headers.get('X-Application-Version')).toBe(`${Environment[environment]}-${appVersion}`)
    expect(request.headers.get('Content-Type')).toBe('application/json')
  })

  it('should get url for url and params', () => {
    const urlWithoutExistingParams = requestHandler['urlForUrlAndParams']('url', { key: 'value' })
    expect(urlWithoutExistingParams).toBe('url?key=value')

    const urlWithExistingParams = requestHandler['urlForUrlAndParams']('url?key=value', { key2: 'value2' })
    expect(urlWithExistingParams).toBe('url?key=value&key2=value2')
  })

  it('should create request body if not GET', () => {
    const body = requestHandler['createRequestBody']({
      url: 'url',
      verb: HttpVerb.Post,
      external: false,
      authentication: 'authentication',
      customHeaders: [],
      params: {
        key: 'value',
      },
    })

    expect(body).toBe('{"key":"value"}')
  })

  it('should not create request body if GET', () => {
    const body = requestHandler['createRequestBody']({
      url: 'url',
      verb: HttpVerb.Get,
      external: false,
      authentication: 'authentication',
      customHeaders: [],
      params: {
        key: 'value',
      },
    })

    expect(body).toBeUndefined()
  })

  it('should handle json response', async () => {
    const fetchResponse = new Response('{"key":"value"}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await requestHandler['handleFetchResponse'](fetchResponse)

    expect(response).toEqual({
      status: 200,
      headers: new Map<string, string | null>([['content-type', 'application/json']]),
      data: {
        key: 'value',
      },
      key: 'value',
    })
  })

  it('should handle non-json response', async () => {
    const fetchResponse = new Response('body', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const response = await requestHandler['handleFetchResponse'](fetchResponse)

    expect(response.status).toBe(200)
    expect(response.headers).toEqual(new Map<string, string | null>([['content-type', 'text/plain']]))
    expect(response.data).toBeInstanceOf(ArrayBuffer)
  })

  it('should have ratelimit error when forbidden', async () => {
    const fetchResponse = new Response('body', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const response = await requestHandler['handleFetchResponse'](fetchResponse)

    expect(response.status).toBe(403)
    expect(response.headers).toEqual(new Map<string, string | null>([['content-type', 'text/plain']]))
    expect((response.data as HttpErrorResponseBody).error).toEqual({
      message: ErrorMessage.RateLimited,
    })
  })

  describe('should return ErrorResponse when status is not >=200 and <500', () => {
    it('should add unknown error message when response has no data', async () => {
      const fetchResponse = new Response('', {
        status: 599,
        headers: {
          'Content-Type': 'text/plain',
        },
      })

      const response = await requestHandler['handleFetchResponse'](fetchResponse)

      expect(response.status).toBe(599)
      expect(response.headers).toEqual(new Map<string, string | null>([['content-type', 'text/plain']]))
      expect((response.data as HttpErrorResponseBody).error).toEqual({
        message: 'Unknown error',
      })
    })
  })
})
