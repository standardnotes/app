import Tab from './Tab'
import TabList from './TabList'
import { TabState } from './useTabState'

type Props = {
  tabs: {
    id: string
    title: string
  }[]
  state: TabState
  children: React.ReactNode
}

const TabsContainer = ({ tabs, state, children }: Props) => {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <TabList state={state} className="border-b border-border">
        {tabs.map(({ id, title }) => (
          <Tab key={id} id={id} className="first:rounded-tl-md">
            {title}
          </Tab>
        ))}
      </TabList>
      {children}
    </div>
  )
}

export default TabsContainer
