import { Environment } from '@standardnotes/models'

import { DeviceInterface } from './DeviceInterface'
import { MobileDeviceInterface } from './MobileDeviceInterface'
import { isMobileDevice, isNativeMobileWebDevice } from './TypeCheck'

describe('device type check', () => {
  it('should return true for mobile devices', () => {
    const device = { environment: Environment.Mobile } as jest.Mocked<MobileDeviceInterface>

    expect(isMobileDevice(device)).toBeTruthy()

    const nativeMobileWeb = { environment: Environment.NativeMobileWeb } as jest.Mocked<MobileDeviceInterface>

    expect(isNativeMobileWebDevice(nativeMobileWeb)).toBeTruthy()
  })

  it('should return false for non mobile devices', () => {
    const device = { environment: Environment.Web } as jest.Mocked<DeviceInterface>

    expect(isMobileDevice(device)).toBeFalsy()
    expect(isNativeMobileWebDevice(device)).toBeFalsy()
  })
})
