import { createContext, useContext, useState } from 'react'

export const useTabState = ({ defaultTab }: { defaultTab: string }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return { activeTab, setActiveTab }
}

export type TabState = ReturnType<typeof useTabState>

type TabContextValue = {
  state: TabState
}

export const TabStateContext = createContext<TabContextValue | undefined>(undefined)

export const useTabStateContext = () => {
  const context = useContext(TabStateContext)

  if (context === undefined) {
    throw new Error('useTabStateContext must be used within a <TabList/>')
  }

  if (context.state === undefined) {
    throw new Error('Tab state must be provided to the parent <TabList/>')
  }

  return context
}
