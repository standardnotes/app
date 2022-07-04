import { useMemo, Dispatch, ReactNode, SetStateAction } from 'react'
import Icon from '@/Components/Icon/Icon'
import { AppPaneId, AppPaneTitles } from './PaneId'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  children: ReactNode
  contentClassName?: string
  contentElementId?: string
  paneId: AppPaneId
  selectedPane: AppPaneId
  setSelectedPane: Dispatch<SetStateAction<AppPaneId>>
}

const ResponsivePaneContent = ({
  children,
  contentClassName,
  contentElementId,
  paneId,
  selectedPane,
  setSelectedPane,
}: Props) => {
  const isSelectedPane = useMemo(() => selectedPane === paneId, [paneId, selectedPane])

  return (
    <>
      <button
        className={classNames(
          'flex w-full items-center justify-between border-b border-solid border-border px-4 py-2 md:hidden',
          isSelectedPane ? 'bg-contrast' : 'bg-default',
        )}
        onClick={() => setSelectedPane(paneId)}
      >
        <span>{AppPaneTitles[paneId]}</span>
        <Icon type="chevron-down" />
      </button>
      <div id={contentElementId} className={classNames('content', !isSelectedPane && 'hidden', contentClassName)}>
        {children}
      </div>
    </>
  )
}

export default ResponsivePaneContent
