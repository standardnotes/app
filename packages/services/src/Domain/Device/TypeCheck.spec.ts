import { Environment } from '@standardnotes/models'

import { DeviceInterface } from './DeviceInterface'
import { MobileDeviceInterface } from './MobileDeviceInterface'
import { isMobileDevice } from './TypeCheck'

describe('device type check', () => {
  it('should return true for mobile devices', () => {
    const device = { environment: Environment.Mobile } as jest.Mocked<MobileDeviceInterface>

    expect(isMobileDevice(device)).toBeTruthy()
  })

  it('should return false for non mobile devices', () => {
    const device = { environment: Environment.Web } as jest.Mocked<DeviceInterface>

    expect(isMobileDevice(device)).toBeFalsy()
  })
})
