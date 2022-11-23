import { useMemo, ReactNode } from 'react'
import { AppPaneId } from './AppPaneMetadata'
import { classNames } from '@standardnotes/utils'
import { useResponsiveAppPane } from './ResponsivePaneProvider'

type Props = {
  children: ReactNode
  className?: string
  contentElementId?: string
  paneId: AppPaneId
}

const ResponsivePaneContent = ({ children, className, contentElementId, paneId }: Props) => {
  const { selectedPane } = useResponsiveAppPane()

  const isSelectedPane = useMemo(() => selectedPane === paneId, [paneId, selectedPane])

  return (
    <div
      id={contentElementId}
      className={classNames('content flex flex-col', isSelectedPane ? 'h-full' : 'hidden md:flex', className)}
    >
      {children}
    </div>
  )
}

export default ResponsivePaneContent
