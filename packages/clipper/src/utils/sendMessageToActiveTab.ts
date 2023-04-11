import { tabs } from 'webextension-polyfill'
import { RuntimeMessageReturnTypes, RuntimeMessageType } from '../types/message'

export default async function sendMessageToActiveTab<T extends RuntimeMessageType>(
  type: T,
): Promise<RuntimeMessageReturnTypes[T] | undefined> {
  const [activeTab] = await tabs.query({ active: true, currentWindow: true, windowType: 'normal' })

  if (!activeTab || !activeTab.id) {
    return
  }

  return await tabs.sendMessage(activeTab.id, { type })
}
