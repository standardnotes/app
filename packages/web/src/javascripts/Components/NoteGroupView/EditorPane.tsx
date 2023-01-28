import { WebApplication } from '@/Application/Application'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { ForwardedRef, forwardRef } from 'react'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { usePaneGesture } from '../Panes/usePaneGesture'
import NoteGroupView from './NoteGroupView'

type Props = {
  application: WebApplication
  className?: string
  id: string
}

const EditorPane = forwardRef(({ application, className, id }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const { setPaneLayout } = useResponsiveAppPane()

  const [setElement] = usePaneGesture({
    onSwipeRight: () => {
      setPaneLayout(PaneLayout.ItemSelection)
    },
  })

  return (
    <div
      id={id}
      ref={mergeRefs([ref, setElement])}
      className={`flex h-full flex-grow flex-col pt-safe-top ${className}`}
    >
      <NoteGroupView className={className} application={application} />
    </div>
  )
})

export default EditorPane
