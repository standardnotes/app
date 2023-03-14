import { tabs } from 'webextension-polyfill'

export default async function getSelectionHTML() {
  const [activeTab] = await tabs.query({ active: true, currentWindow: true })

  if (!activeTab || !activeTab.id) {
    return
  }

  return await tabs.sendMessage(activeTab.id, { type: 'get-selection' })
}
