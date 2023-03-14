import { tabs } from 'webextension-polyfill'
import { RuntimeMessageTypes } from '../types/message'

export default async function getArticleHTML() {
  const [activeTab] = await tabs.query({ active: true, currentWindow: true })

  if (!activeTab || !activeTab.id) {
    return
  }

  return await tabs.sendMessage(activeTab.id, { type: RuntimeMessageTypes.GetArticle })
}
