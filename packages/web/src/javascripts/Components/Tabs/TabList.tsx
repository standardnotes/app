import { ComponentPropsWithoutRef, useMemo } from 'react'
import { TabStateContext, TabState } from './useTabState'

type Props = {
  state: TabState
} & ComponentPropsWithoutRef<'div'>

const TabList = ({ state, children, ...props }: Props) => {
  const providerValue = useMemo(
    () => ({
      state,
    }),
    [state],
  )

  return (
    <TabStateContext.Provider value={providerValue}>
      <div role="tablist" {...props}>
        {children}
      </div>
    </TabStateContext.Provider>
  )
}

export default TabList
