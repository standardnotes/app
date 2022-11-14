import { Environment } from '@standardnotes/models'

import { HttpResponseMeta } from './HttpResponseMeta'
import { HttpService } from './HttpService'

describe('HttpService', () => {
  const environment = Environment.Web
  const appVersion = '1.2.3'
  const snjsVersion = '2.3.4'
  const host = 'http://bar'
  let updateMetaCallback: (meta: HttpResponseMeta) => void

  const createService = () => {
    const service = new HttpService(environment, appVersion, snjsVersion, updateMetaCallback)
    service.setHost(host)
    return service
  }

  beforeEach(() => {
    updateMetaCallback = jest.fn()
  })

  it('should set host', () => {
    const service = createService()

    expect(service['host']).toEqual('http://bar')

    service.setHost('http://foo')

    expect(service['host']).toEqual('http://foo')
  })

  it('should set and use the authorization token', () => {
    const service = createService()

    expect(service['authorizationToken']).toBeUndefined()

    service.setAuthorizationToken('foo-bar')

    expect(service['authorizationToken']).toEqual('foo-bar')
  })
})
