import { ComponentPropsWithoutRef } from 'react'
import { TabState } from './useTabState'

type Props = { state: TabState; id: string } & ComponentPropsWithoutRef<'div'>

const TabPanel = ({ state, id, children, ...props }: Props) => {
  const { activeTab } = state

  const isActive = activeTab === id

  if (!isActive) {
    return null
  }

  return (
    <div role="tabpanel" id={`tab-panel-${id}`} aria-labelledby={`tab-control-${id}`} {...props}>
      {children}
    </div>
  )
}

export default TabPanel
