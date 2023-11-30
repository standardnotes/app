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

  if (response.status !== 200) {
    const responseText = await response.text()

    throw new Error(`Failed to publish mocked event: ${responseText}`)
  }
}
