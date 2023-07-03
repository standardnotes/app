import * as Defaults from './Defaults.js'

export async function publishMockedEvent(eventType, eventPayload) {
  const response = await fetch(`${Defaults.getDefaultMockedEventServiceUrl()}/events`, {
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

  if (!response.ok) {
    console.error(`Failed to publish mocked event: ${response.status} ${response.statusText}`)
  }
}
