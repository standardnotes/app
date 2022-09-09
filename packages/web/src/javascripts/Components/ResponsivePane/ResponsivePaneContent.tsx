import { useMemo, ReactNode } from 'react'
import { AppPaneId } from './AppPaneMetadata'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useResponsiveAppPane } from './ResponsivePaneProvider'

type Props = {
  children: ReactNode
  contentClassName?: string
  contentElementId?: string
  paneId: AppPaneId
}

const ResponsivePaneContent = ({ children, contentClassName, contentElementId, paneId }: Props) => {
  const { selectedPane } = useResponsiveAppPane()

  const isSelectedPane = useMemo(() => selectedPane === paneId, [paneId, selectedPane])

  return (
    <div
      id={contentElementId}
      className={classNames('content flex flex-col', isSelectedPane ? 'h-full' : 'hidden md:flex', contentClassName)}
    >
      {children}
    </div>
  )
}

export default ResponsivePaneContent
