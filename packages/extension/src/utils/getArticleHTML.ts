import { tabs } from 'webextension-polyfill'

export default async function getArticleHTML() {
  const [activeTab] = await tabs.query({ active: true, currentWindow: true })

  if (!activeTab) {
    return
  }

  return await tabs.sendMessage(activeTab.id, { type: 'get-article' })
}

