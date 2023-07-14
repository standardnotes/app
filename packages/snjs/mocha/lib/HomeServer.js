import * as Defaults from './Defaults.js'

export async function activatePremiumFeatures(username, subscriptionPlanName, endsAt) {
  await fetch(`${Defaults.getDefaultHost()}/e2e/activate-premium`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      subscriptionPlanName,
      endsAt,
    }),
  })
}
