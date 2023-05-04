import { WebApplication } from '@/Application/WebApplication'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { ForwardedRef, forwardRef } from 'react'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { usePaneSwipeGesture } from '../Panes/usePaneGesture'
import NoteGroupView from './NoteGroupView'

type Props = {
  application: WebApplication
  className?: string
  id: string
}

const EditorPane = forwardRef(({ application, className, id }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const { setPaneLayout } = useResponsiveAppPane()

  const [setElement] = usePaneSwipeGesture('right', () => {
    setPaneLayout(PaneLayout.ItemSelection)
  })

  return (
    <div
      id={id}
      ref={mergeRefs([ref, setElement])}
      className={`flex h-full flex-grow flex-col bg-default pt-safe-top ${className}`}
    >
      <NoteGroupView className={className} application={application} />
    </div>
  )
})

export default EditorPane
