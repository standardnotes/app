import * as Defaults from './Defaults.js'

export async function publishMockedEvent(eventType, eventPayload) {
  await fetch(`${Defaults.getDefaultMockedEventServiceUrl()}/events`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType,
      eventPayload,
    }),
  })
}
