export const DefaultServerPort = 4000

export function getDefaultHost() {
  return `http://localhost:${DefaultServerPort}`
}

export function getDefaultMockedEventServiceUrl() {
  return 'http://localhost:3124'
}

export function getDefaultWebSocketUrl() {
  return undefined
}

export function getAppVersion() {
  return '1.2.3'
}
