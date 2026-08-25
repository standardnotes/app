import { tabs } from 'webextension-polyfill'
import { RuntimeMessage, RuntimeMessageReturnTypes } from '../types/message'

export default async function sendMessageToActiveTab<T extends RuntimeMessage>(
  message: T,
): Promise<RuntimeMessageReturnTypes[T['type']] | undefined> {
  const [activeTab] = await tabs.query({ active: true, lastFocusedWindow: true })

  if (!activeTab?.id) {
    return
  }

  try {
    return await tabs.sendMessage(activeTab.id, message)
  } catch {
    return
  }
}
