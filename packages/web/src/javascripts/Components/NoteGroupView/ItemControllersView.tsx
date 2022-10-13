import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { FileViewController, NoteViewController } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import FileView from '../FileView/FileView'
import NoteView from '../NoteView/NoteView'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

type Props = {
  controllers: (NoteViewController | FileViewController)[]
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const ItemControllersView = ({ controllers, application, viewControllerManager }: Props) => {
  const { selectedPane } = useResponsiveAppPane()
  const isMediumScreenSize = useMediaQuery(MediaQueryBreakpoints.md)

  if (selectedPane !== AppPaneId.Editor && !isMediumScreenSize) {
    return null
  }

  return (
    <>
      {controllers.map((controller) => {
        return controller instanceof NoteViewController ? (
          <NoteView key={controller.runtimeId} application={application} controller={controller} />
        ) : (
          <FileView
            key={controller.runtimeId}
            application={application}
            viewControllerManager={viewControllerManager}
            file={controller.item}
          />
        )
      })}
    </>
  )
}

export default observer(ItemControllersView)
