import { classNames } from '@/Utils/ConcatenateClassNames'
import { ComponentPropsWithoutRef } from 'react'
import { useTabStateContext } from './useTabState'

type Props = { id: string } & ComponentPropsWithoutRef<'button'>

const Tab = ({ id, className, children, ...props }: Props) => {
  const { state } = useTabStateContext()
  const { activeTab, setActiveTab } = state

  const isActive = activeTab === id

  return (
    <button
      role="tab"
      id={`tab-control-${id}`}
      onClick={() => {
        setActiveTab(id)
      }}
      aria-selected={isActive}
      aria-controls={`tab-panel-${id}`}
      className={classNames(
        'relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:shadow-inner',
        isActive ? 'font-medium text-info shadow-bottom' : 'text-text',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Tab
