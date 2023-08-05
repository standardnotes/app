import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'
import FileViewWithoutProtection from './FileViewWithoutProtection'
import { FileViewProps } from './FileViewProps'
import { ApplicationEvent } from '@standardnotes/snjs'

const FileView = ({ application, file }: FileViewProps) => {
  const [shouldShowProtectedOverlay, setShouldShowProtectedOverlay] = useState(false)

  useEffect(() => {
    application.filesController.setShowProtectedOverlay(!application.isAuthorizedToRenderItem(file))
  }, [application, file, application.filesController])

  useEffect(() => {
    setShouldShowProtectedOverlay(application.filesController.showProtectedOverlay)
  }, [application.filesController.showProtectedOverlay])

  const dismissProtectedOverlay = useCallback(async () => {
    let showFileContents = true

    if (application.hasProtectionSources()) {
      showFileContents = await application.protections.authorizeItemAccess(file)
    }

    if (showFileContents) {
      setShouldShowProtectedOverlay(false)
    }
  }, [application, file])

  useEffect(() => {
    const disposer = application.addEventObserver(async (event) => {
      if (event === ApplicationEvent.UnprotectedSessionBegan) {
        setShouldShowProtectedOverlay(false)
      } else if (event === ApplicationEvent.UnprotectedSessionExpired) {
        setShouldShowProtectedOverlay(!application.isAuthorizedToRenderItem(file))
      }
    })

    return disposer
  }, [application, file])

  return shouldShowProtectedOverlay ? (
    <ProtectedItemOverlay
      showAccountMenu={application.showAccountMenu}
      hasProtectionSources={application.hasProtectionSources()}
      onViewItem={dismissProtectedOverlay}
      itemType={'file'}
    />
  ) : (
    <FileViewWithoutProtection application={application} file={file} />
  )
}

export default observer(FileView)
