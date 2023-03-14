import { tabs } from 'webextension-polyfill'
import { RuntimeMessageType } from '../types/message'

export default async function sendMessageToActiveTab(type: RuntimeMessageType) {
  const [activeTab] = await tabs.query({ active: true, currentWindow: true })

  if (!activeTab || !activeTab.id) {
    return
  }

  return await tabs.sendMessage(activeTab.id, { type })
}
