import { DeviceInterface, MobileDeviceInterface, Platform, platformFromString } from '@standardnotes/snjs'
import { IsDesktopPlatform, IsWebPlatform } from '@/Constants/Version'
import { EMAIL_REGEX } from '../Constants/Constants'
import { MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isAndroid, isIOS } from '@standardnotes/ui-services'

declare const process: {
  env: {
    NODE_ENV: string | null | undefined
  }
}

export const isDev = process.env.NODE_ENV === 'development'

export function getPlatformString() {
  try {
    const platform = navigator.platform.toLowerCase()
    let trimmed = ''
    if (platform.includes('iphone') || isIOS()) {
      trimmed = 'ios'
    } else if (platform.includes('android') || isAndroid()) {
      trimmed = 'android'
    } else if (platform.includes('mac')) {
      trimmed = 'mac'
    } else if (platform.includes('win')) {
      trimmed = 'windows'
    } else if (platform.includes('linux')) {
      trimmed = 'linux'
    } else {
      /** Treat other platforms as linux */
      trimmed = 'linux'
    }
    return trimmed + (isDesktopApplication() ? '-desktop' : '-web')
  } catch (e) {
    return 'unknown-platform'
  }
}

export function getPlatform(device: DeviceInterface | MobileDeviceInterface): Platform {
  if ('platform' in device) {
    return device.platform
  }

  return platformFromString(getPlatformString())
}

export function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

/** Via https://davidwalsh.name/javascript-debounce-function */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce(this: unknown, func: any, wait: number, immediate = false) {
  let timeout: NodeJS.Timeout | null
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, no-invalid-this
    const context = this
    // eslint-disable-next-line prefer-rest-params
    const args = arguments
    const later = function () {
      timeout = null
      if (!immediate) {
        func.apply(context, args)
      }
    }
    const callNow = immediate && !timeout
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
    if (callNow) {
      func.apply(context, args)
    }
  }
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'includes', {
    value: function (searchElement: unknown, fromIndex: number) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined')
      }

      // 1. Let O be ? ToObject(this value).
      const o = Object(this)

      // 2. Let len be ? ToLength(? Get(O, "length")).
      const len = o.length >>> 0

      // 3. If len is 0, return false.
      if (len === 0) {
        return false
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      const n = fromIndex | 0

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)

      function sameValueZero(x: unknown, y: unknown) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y))
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true
        }
        // c. Increase k by 1.
        k++
      }

      // 8. Return false
      return false
    },
  })
}

export async function preventRefreshing(message: string, operation: () => Promise<void> | void) {
  const onBeforeUnload = window.onbeforeunload
  try {
    window.onbeforeunload = () => message
    await operation()
  } finally {
    window.onbeforeunload = onBeforeUnload
  }
}

if (!IsWebPlatform && !IsDesktopPlatform) {
  throw Error('Neither __WEB__ nor __DESKTOP__ is true. Check your configuration files.')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function destroyAllObjectProperties(object: any): void {
  for (const prop of Object.getOwnPropertyNames(object)) {
    try {
      delete object[prop]
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }
}

export function isDesktopApplication() {
  return IsDesktopPlatform
}

export function getDesktopVersion() {
  return window.electronAppVersion
}

export const isEmailValid = (email: string): boolean => {
  return EMAIL_REGEX.test(email)
}

export const openInNewTab = (url: string) => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
  if (newWindow) {
    newWindow.opener = null
  }
}

export const convertStringifiedBooleanToBoolean = (value: string) => {
  return value !== 'false'
}

// https://stackoverflow.com/a/57527009/2504429
export const disableIosTextFieldZoom = () => {
  const addMaximumScaleToMetaViewport = () => {
    const viewportMetaElement = document.querySelector('meta[name=viewport]')

    if (viewportMetaElement !== null) {
      let content = viewportMetaElement.getAttribute('content')
      if (!content) {
        return
      }
      const maximumScaleRegex = /maximum-scale=[0-9.]+/g

      if (maximumScaleRegex.test(content)) {
        content = content.replace(maximumScaleRegex, 'maximum-scale=1.0')
      } else {
        content = [content, 'maximum-scale=1.0'].join(', ')
      }

      viewportMetaElement.setAttribute('content', content)
    }
  }

  if (isIOS()) {
    addMaximumScaleToMetaViewport()
  }
}

export const isMobileScreen = () => window.matchMedia(MutuallyExclusiveMediaQueryBreakpoints.sm).matches

export const isTabletScreen = () => window.matchMedia(MutuallyExclusiveMediaQueryBreakpoints.md).matches

export const isTabletOrMobileScreen = () => isMobileScreen() || isTabletScreen()

export const getBase64FromBlob = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject()
      }
    }
    reader.readAsDataURL(blob)
  })
}

export const getBlobFromBase64 = (b64Data: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize)

    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  const blob = new Blob(byteArrays, { type: contentType })
  return blob
}

export function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) {
    return null
  }

  if (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth) {
    return node
  } else {
    return getScrollParent(node.parentElement)
  }
}

export function remToPx(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
