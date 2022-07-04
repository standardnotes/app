import { useMemo, ReactNode } from 'react'
import Icon from '@/Components/Icon/Icon'
import { AppPaneId, AppPaneTitles } from './PaneId'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  children: ReactNode
  contentClassName?: string
  contentElementId?: string
  paneId: AppPaneId
  selectedPane: AppPaneId
  togglePane: (pane: AppPaneId) => void
}

const ResponsivePaneContent = ({
  children,
  contentClassName,
  contentElementId,
  paneId,
  selectedPane,
  togglePane,
}: Props) => {
  const isSelectedPane = useMemo(() => selectedPane === paneId, [paneId, selectedPane])

  return (
    <>
      <button
        className={classNames(
          'flex w-full items-center justify-between border-b border-solid border-border px-4 py-2 md:hidden',
          isSelectedPane ? 'bg-contrast' : 'bg-default',
        )}
        onClick={() => togglePane(paneId)}
      >
        <span>{AppPaneTitles[paneId]}</span>
        <Icon type="chevron-down" />
      </button>
      <div
        id={contentElementId}
        className={classNames('content', !isSelectedPane && 'hidden flex-col md:flex', contentClassName)}
      >
        {children}
      </div>
    </>
  )
}

export default ResponsivePaneContent
